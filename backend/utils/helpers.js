const fs = require("fs");
const path = require("path");
const config = require("../config/environment");

class Helpers {
  static ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  static sanitizeFilename(name) {
    return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  }

  static formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  static calculateTotals(items, discountPct = 0, taxPct = 0) {
    const subTotal = items.reduce(
      (sum, item) => sum + item.qty * item.unitPrice,
      0
    );
    const discountAmount = (discountPct / 100) * subTotal;
    const afterDiscount = subTotal - discountAmount;
    const taxAmount = (taxPct / 100) * afterDiscount;
    const total = afterDiscount + taxAmount;

    return {
      subTotal,
      discountAmount,
      afterDiscount,
      taxAmount,
      total,
    };
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}

module.exports = Helpers;
