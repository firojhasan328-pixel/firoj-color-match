import emailjs from "@emailjs/browser";

// ========================================
// OTP Email পাঠানোর Function
// ========================================
export async function sendOtpEmail(email, name, otpCode) {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  console.log("EmailJS Config Check:", {
    serviceId: serviceId ? "✅" : "❌",
    templateId: templateId ? "✅" : "❌",
    publicKey: publicKey ? "✅" : "❌",
  });

  if (!serviceId || !templateId || !publicKey) {
    throw new Error(
      "EmailJS Configuration Missing — Vercel Environment Variables চেক করুন"
    );
  }

  const templateParams = {
    to_email: email,
    to_name: name,
    otp_code: otpCode,
  };

  try {
    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      publicKey
    );
    console.log("Email sent successfully:", response);
    return response;
  } catch (err) {
    console.error("EmailJS Send Error:", err);
    throw new Error(
      "ইমেইল পাঠানো যায়নি। " + (err?.text || err?.message || "Unknown error")
    );
  }
}
