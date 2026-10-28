const twilioService = require("../services/twilio-service");
const pdfGenerator = require("../services/pdf-generator");
const Company = require("../models/Company");
const LogoService = require("../services/logo-service");

class ConversationHandler {
  constructor() {
    this.conversations = new Map(); // phoneNumber -> state
  }

  // ---------- Public entry ----------
  async handleMessage(from, body, mediaUrl = null) {
    let state = this.conversations.get(from);
    body = (body || "").trim();

    // If media is received and we're expecting a logo, handle it
    if (mediaUrl && state && state.step === "awaiting_logo") {
      return this._handleLogoUpload(from, state, mediaUrl);
    }

    // No active conversation: check registration
    if (!state) {
      const company = Company.findByPhone(from);
      if (!company) {
        return this._startRegistration(from);
      } else {
        return this._showMainMenu(from, company);
      }
    }

    // Update activity
    state.lastActivity = Date.now();

    // Route based on current step
    const step = state.step;
    switch (step) {
      // Registration steps
      case "awaiting_company_name":
        return this._handleCompanyName(from, state, body);
      case "awaiting_registration_number":
        return this._handleRegNumber(from, state, body);
      case "awaiting_address":
        return this._handleAddress(from, state, body);
      case "awaiting_email":
        return this._handleEmail(from, state, body);
      case "awaiting_logo_decision":
        return this._handleLogoDecision(from, state, body);

      // Main menu
      case "awaiting_menu_choice":
        return this._handleMenuChoice(from, state, body);

      // Document creation steps
      case "awaiting_doc_type":
        return this._handleDocType(from, state, body);
      case "awaiting_client":
        return this._handleClientNameDoc(from, state, body);
      case "awaiting_items":
        return this._handleItemsDoc(from, state, body);
      case "awaiting_discount":
        return this._handleDiscountDoc(from, state, body);
      case "awaiting_tax":
        return this._handleTaxDoc(from, state, body);
      case "awaiting_notes":
        return this._handleNotesDoc(from, state, body);

      default:
        return this._handleUnknown(from);
    }
  }

  // ---------- Registration Flow ----------
  async _startRegistration(from) {
    this.conversations.set(from, {
      step: "awaiting_company_name",
      regData: {},
      lastActivity: Date.now(),
    });
    await twilioService.sendMessage(
      from,
      `🏢 Welcome to the Business Portal! Let's register your company.\n\nPlease provide your **Company Name**:`,
    );
  }

  async _handleCompanyName(from, state, body) {
    if (body.length < 2)
      return twilioService.sendMessage(
        from,
        "Please provide a valid company name.",
      );
    state.regData.companyName = body;
    state.step = "awaiting_registration_number";
    this.conversations.set(from, state);
    await twilioService.sendMessage(
      from,
      `✅ Company: ${body}\nNow enter your **Registration Number**:`,
    );
  }

  async _handleRegNumber(from, state, body) {
    if (!body)
      return twilioService.sendMessage(
        from,
        "Please provide a registration number.",
      );
    state.regData.registrationNumber = body;
    state.step = "awaiting_address";
    this.conversations.set(from, state);
    await twilioService.sendMessage(
      from,
      `✅ Reg No: ${body}\nNow enter your **Company Address**:`,
    );
  }

  async _handleAddress(from, state, body) {
    if (body.length < 5)
      return twilioService.sendMessage(from, "Please provide a valid address.");
    state.regData.address = body;
    state.step = "awaiting_email";
    this.conversations.set(from, state);
    await twilioService.sendMessage(
      from,
      `✅ Address: ${body}\nNow enter your **Company Email**:`,
    );
  }

  async _handleEmail(from, state, body) {
    if (!/^\S+@\S+\.\S+$/.test(body))
      return twilioService.sendMessage(from, "Please provide a valid email.");
    state.regData.email = body;
    state.step = "awaiting_logo_decision";
    this.conversations.set(from, state);
    await twilioService.sendMessage(
      from,
      `✅ Email: ${body}\n\nWould you like to upload a company logo?\nReply **YES** or **SKIP**`,
    );
  }

  async _handleLogoDecision(from, state, body) {
    const lower = body.toLowerCase();
    if (lower === "yes" || lower === "y") {
      state.step = "awaiting_logo";
      this.conversations.set(from, state);
      await twilioService.sendMessage(
        from,
        `📸 Please send your company logo as an image attachment.\n(You can tap the 📎 icon and select a photo.)`,
      );
    } else if (lower === "skip" || lower === "no") {
      await this._completeRegistration(from, state);
    } else {
      await twilioService.sendMessage(
        from,
        "Please reply with **YES** or **SKIP**.",
      );
    }
  }

  async _handleLogoUpload(from, state, mediaUrl) {
    await twilioService.sendMessage(from, "🖼️ Processing your logo...");
    const result = await LogoService.handleLogoUpload(from, mediaUrl);
    if (result.success) {
      state.regData.logoUrl = result.logoUrl;
      await this._completeRegistration(from, state);
    } else {
      await twilioService.sendMessage(
        from,
        "❌ Failed to upload logo. You can try again later.",
      );
      // Optionally allow skipping
    }
  }

  async _completeRegistration(from, state) {
    const company = Company.create({
      phoneNumber: from,
      companyName: state.regData.companyName,
      registrationNumber: state.regData.registrationNumber,
      address: state.regData.address,
      email: state.regData.email,
      logoUrl: state.regData.logoUrl || null,
    });
    this.conversations.delete(from);
    await twilioService.sendMessage(
      from,
      `🎉 Registration complete!\n\nCompany: ${company.companyName}\n\nYou can now create documents. Send any message to start.`,
    );
    // Show main menu immediately
    await this._showMainMenu(from, company);
  }

  // ---------- Main Menu ----------
  async _showMainMenu(from, company) {
    const state = {
      step: "awaiting_menu_choice",
      company,
      lastActivity: Date.now(),
    };
    this.conversations.set(from, state);
    await twilioService.sendMessage(
      from,
      `👋 Welcome back, ${company.companyName}!\n\nWhat would you like to do?\n` +
        `1. 📄 Create Quote\n2. 🧾 Create Invoice\n3. 📑 Create Receipt\n4. ℹ️ My Info\n5. 🖼️ Update Logo\n\n` +
        `Reply with the number.`,
    );
  }

  async _handleMenuChoice(from, state, body) {
    const choice = body.trim().toLowerCase();
    const company = state.company;

    if (choice.startsWith("1") || choice.includes("quote")) {
      return this._startDocumentCreation(from, company, "quote");
    } else if (choice.startsWith("2") || choice.includes("invoice")) {
      return this._startDocumentCreation(from, company, "invoice");
    } else if (choice.startsWith("3") || choice.includes("receipt")) {
      return this._startDocumentCreation(from, company, "receipt");
    } else if (choice.startsWith("4") || choice.includes("info")) {
      await this._showCompanyInfo(from, company);
    } else if (choice.startsWith("5") || choice.includes("logo")) {
      await this._startLogoUpdate(from, company);
    } else {
      await twilioService.sendMessage(
        from,
        "Invalid choice. Please select 1, 2, 3, 4, or 5.",
      );
    }
  }

  // ---------- Document Creation Flow ----------
  async _startDocumentCreation(from, company, docType) {
    const state = {
      step: "awaiting_client",
      docType: docType,
      company: company,
      items: [],
      lastActivity: Date.now(),
    };
    this.conversations.set(from, state);
    await twilioService.sendMessage(
      from,
      `📝 Creating a new ${docType}.\n\nPlease enter the **client name**:`,
    );
  }

  async _handleClientNameDoc(from, state, body) {
    if (body.length < 2)
      return twilioService.sendMessage(from, "Please provide a client name.");
    state.clientName = body;
    state.step = "awaiting_items";
    this.conversations.set(from, state);
    await twilioService.sendMessage(
      from,
      `✅ Client: ${body}\n\nNow add items in format:\n**Item Name | Quantity | Unit Price**\nExample: Laptop | 2 | 1500\n\nSend **DONE** when finished.`,
    );
  }

  async _handleItemsDoc(from, state, body) {
    if (body.toLowerCase() === "done") {
      if (state.items.length === 0) {
        return twilioService.sendMessage(
          from,
          "Please add at least one item before finishing.",
        );
      }
      state.step = "awaiting_discount";
      this.conversations.set(from, state);
      return twilioService.sendMessage(
        from,
        `✅ ${state.items.length} items added.\nEnter discount % (0 for none):`,
      );
    }

    const parts = body.split("|").map((s) => s.trim());
    if (parts.length < 3) {
      return twilioService.sendMessage(
        from,
        "Invalid format. Use: Item | Qty | Price",
      );
    }
    const [name, qtyStr, priceStr] = parts;
    const qty = parseFloat(qtyStr);
    const price = parseFloat(priceStr);
    if (!name || isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
      return twilioService.sendMessage(
        from,
        "Invalid values. Please try again.",
      );
    }
    state.items.push({ name, qty, unitPrice: price });
    this.conversations.set(from, state);
    await twilioService.sendMessage(
      from,
      `✅ Added: ${name} x${qty} @ P${price.toFixed(2)}\nAdd another or DONE.`,
    );
  }

  async _handleDiscountDoc(from, state, body) {
    const pct = parseFloat(body);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      return twilioService.sendMessage(
        from,
        "Please enter a valid percentage (0-100).",
      );
    }
    state.discount = pct;
    state.step = "awaiting_tax";
    this.conversations.set(from, state);
    await twilioService.sendMessage(
      from,
      `Discount: ${pct}%\nEnter tax % (0 for none):`,
    );
  }

  async _handleTaxDoc(from, state, body) {
    const pct = parseFloat(body);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      return twilioService.sendMessage(
        from,
        "Please enter a valid percentage.",
      );
    }
    state.tax = pct;
    state.step = "awaiting_notes";
    this.conversations.set(from, state);
    await twilioService.sendMessage(
      from,
      `Tax: ${pct}%\nEnter notes (or SKIP):`,
    );
  }

  async _handleNotesDoc(from, state, body) {
    state.notes = body.toLowerCase() === "skip" ? "" : body;
    // Generate document
    await twilioService.sendMessage(from, "📊 Generating your document...");

    try {
      const docNumber = `${state.docType.toUpperCase()}-${Date.now()}`;
      const result = await pdfGenerator.generateDocument({
        docType: state.docType,
        docNumber: docNumber,
        clientName: state.clientName,
        items: state.items,
        discountPct: state.discount || 0,
        taxPct: state.tax || 0,
        notes: state.notes || "",
        company: state.company,
      });

      const message = `✅ Your ${state.docType} #${docNumber} for ${state.clientName} is ready!`;
      await twilioService.sendMessage(from, message, result.publicUrl);
      // Also send link as backup
      await twilioService.sendMessage(from, `🔗 Download: ${result.publicUrl}`);

      // Clear conversation and return to menu
      this.conversations.delete(from);
      await this._showMainMenu(from, state.company);
    } catch (error) {
      console.error("Document generation failed:", error);
      await twilioService.sendMessage(
        from,
        "❌ Failed to generate document. Please try again.",
      );
    }
  }

  // ---------- Utilities ----------
  async _showCompanyInfo(from, company) {
    let msg = `🏢 **Company Info**\n\nName: ${company.companyName}\nReg: ${company.registrationNumber}\nAddress: ${company.address}\nEmail: ${company.email}\nLogo: ${company.logoUrl ? "✅" : "❌"}`;
    await twilioService.sendMessage(from, msg);
    // Stay in menu: keep state, but allow user to choose again
    await this._showMainMenu(from, company);
  }

  async _startLogoUpdate(from, company) {
    const state = { step: "awaiting_logo", company, lastActivity: Date.now() };
    this.conversations.set(from, state);
    await twilioService.sendMessage(
      from,
      `🖼️ Send your new logo as an image attachment.\nReply CANCEL to abort.`,
    );
  }

  // Override logo handling to update existing company
  async _handleLogoUpload(from, state, mediaUrl) {
    await twilioService.sendMessage(from, "🔄 Updating logo...");
    const result = await LogoService.handleLogoUpload(from, mediaUrl);
    if (result.success) {
      await twilioService.sendMessage(from, "✅ Logo updated successfully!");
    } else {
      await twilioService.sendMessage(from, "❌ Logo update failed.");
    }
    this.conversations.delete(from);
    await this._showMainMenu(from, state.company);
  }

  async _handleUnknown(from) {
    await twilioService.sendMessage(
      from,
      "I lost track. Please start over by sending a new message.",
    );
    this.conversations.delete(from);
  }

  // Cleanup stale conversations
  cleanupStaleConversations() {
    const now = Date.now();
    const timeout = 30 * 60 * 1000;
    for (const [key, state] of this.conversations.entries()) {
      if (now - state.lastActivity > timeout) {
        this.conversations.delete(key);
        console.log(`🧹 Cleaned stale conversation for ${key}`);
      }
    }
  }
}

module.exports = new ConversationHandler();
