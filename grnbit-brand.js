// Canonical GrnBit entity and contact details — align with investor.html + FAQ.md
module.exports = {
  legalName: 'GrnBit Cayman Holdings',
  registeredOffice: 'One Capital Place, Grand Cayman, Cayman Islands',
  mailingLocality: 'George Town, Cayman Islands',
  projectSite: 'Miracle Lake, Karnes County, South Texas — Phase 1',
  projectCounty: 'Karnes County, South Texas',
  powerPartner: 'Xplor Energy / Karnes Electric',
  contactEmail: 'investors@grnbit.digital',
  contactEmailDebt: 'info@grnbit.digital',
  website: 'https://grnbit.digital',
  regulator: 'CIMA (Cayman Islands Monetary Authority)',
  letterhead() {
    return `**${this.legalName}**  \n${this.registeredOffice}  \n${this.website} · ${this.contactEmail}`;
  },
  signature() {
    return `**${this.legalName}**  \n${this.registeredOffice}  \nProject: ${this.projectSite}  \n${this.contactEmail} · ${this.website}`;
  },
  contactLine() {
    return `${this.contactEmail} · ${this.website}`;
  },
};