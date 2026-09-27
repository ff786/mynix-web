import { z } from "zod";

/** Sri Lankan mobile → 07XXXXXXXX (accepts spaces, dashes, 94 / +94 prefixes). */
export const mobileSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[^0-9]/g, ""))
  .transform((d) => (d.length === 11 && d.startsWith("947") ? `0${d.slice(2)}` : d.length === 9 && d.startsWith("7") ? `0${d}` : d))
  .refine((d) => /^07[0-9]{8}$/.test(d), "Enter a Sri Lankan mobile number, e.g. 077 123 4567.");

/** 0771234567 → 077 123 4567 */
export const formatMobile = (phone: string) => phone.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1 $2 $3");
