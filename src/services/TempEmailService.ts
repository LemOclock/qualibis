const TEMP_EMAIL_DOMAINS = [
  "mailinator.com",
  "temp-mail.org",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "maildrop.cc",
  "tempmail.ninja",
  "throwaway.email",
  "getnada.com",
  "mailsac.com",
  "sharklasers.com",
  "grr.la",
  "guerrillamailblock.com",
  "pokemail.net",
  "spam4.me",
  "binkmail.com",
  "mailnesia.com",
  "trashmail.com",
  "mohmal.com",
  "emailondeck.com",
];

export class TempEmailService {
 // vérifie après @ si email correspond à la liste la liste peut être étendu commme on souhaite
  static isTemporaryEmail(email: string): boolean {
    const domain = email.toLowerCase().split("@")[1];
    return TEMP_EMAIL_DOMAINS.includes(domain);
  }

  static validateEmail(email: string): { isValid: boolean; error?: string } {
    if (this.isTemporaryEmail(email)) {
      return {
        isValid: false,
        error: "Les adresses email temporaires/jetables ne sont pas autorisées",
      };
    }

    return { isValid: true };
  }
}
