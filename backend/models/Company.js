const fs = require("fs");
const path = require("path");
const config = require("../config/environment");

const COMPANIES_FILE = path.join(__dirname, "..", "data", "companies.json");

class CompanyModel {
  constructor() {
    this.ensureDirectories();
    this.loadCompanies();
  }

  ensureDirectories() {
    const dataDir = path.dirname(COMPANIES_FILE);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(config.LOGO_DIR))
      fs.mkdirSync(config.LOGO_DIR, { recursive: true });
  }

  loadCompanies() {
    try {
      if (fs.existsSync(COMPANIES_FILE)) {
        this.companies = JSON.parse(fs.readFileSync(COMPANIES_FILE, "utf8"));
      } else {
        this.companies = [];
        this.saveCompanies();
      }
    } catch (error) {
      console.error("Error loading companies:", error);
      this.companies = [];
    }
  }

  saveCompanies() {
    fs.writeFileSync(COMPANIES_FILE, JSON.stringify(this.companies, null, 2));
  }

  findByPhone(phoneNumber) {
    return this.companies.find((c) => c.phoneNumber === phoneNumber);
  }

  create(companyData) {
    const company = {
      id: `COMP-${Date.now()}`,
      phoneNumber: companyData.phoneNumber,
      companyName: companyData.companyName,
      registrationNumber: companyData.registrationNumber,
      address: companyData.address,
      email: companyData.email,
      logoUrl: companyData.logoUrl || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.companies.push(company);
    this.saveCompanies();
    return company;
  }

  updateLogo(phoneNumber, logoUrl) {
    const company = this.findByPhone(phoneNumber);
    if (company) {
      company.logoUrl = logoUrl;
      company.updatedAt = new Date().toISOString();
      this.saveCompanies();
    }
    return company;
  }

  getAll() {
    return this.companies;
  }
}

module.exports = new CompanyModel();
