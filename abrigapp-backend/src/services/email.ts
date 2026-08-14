import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendOtpEmail = async (to: string, otp: string) => {
  const mailOptions = {
    from: `"AbrigApp Colombia" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Tu código de acceso - AbrigApp',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #64b496;">Bienvenido a AbrigApp</h2>
        <p>Tu código de un solo uso (OTP) es:</p>
        <h1 style="letter-spacing: 5px; color: #000;">${otp}</h1>
        <p>Este código expira en 10 minutos. Si no solicitaste esto, puedes ignorar este correo.</p>
        <br/>
        <p>¡Gracias por unirte a nuestra red de apoyo solidario!</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw error;
  }
};
