import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOtpEmail = async (to: string, otp: string) => {
  const mailOptions = {
    from: `"AbrigApp Colombia" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: 'Tu código de acceso - AbrigApp',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://abrigapp-co.vercel.app/logo.png" alt="AbrigApp Logo" style="width: 80px; height: 80px; border-radius: 50%;">
        </div>
        <h2 style="color: #2b7a78; text-align: center;">Bienvenido a AbrigApp</h2>
        <p style="text-align: center;">Tu código de un solo uso (OTP) es:</p>
        <div style="text-align: center; margin: 20px 0;">
          <h1 style="letter-spacing: 5px; color: #000; background-color: #f4f4f4; padding: 15px; border-radius: 8px; display: inline-block;">${otp}</h1>
        </div>
        <p style="text-align: center; color: #666;">Este código expira en 10 minutos. Si no solicitaste esto, puedes ignorar este correo.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="text-align: center; font-weight: bold; color: #2b7a78;">¡Gracias por unirte a nuestra red de apoyo solidario!</p>
        <div style="text-align: center; margin-top: 20px;">
          <p style="font-size: 12px; color: #999;">Síguenos en nuestras redes:</p>
          <a href="https://www.instagram.com/abrigappcolombia/" style="text-decoration: none; margin: 0 10px; color: #2b7a78; font-weight: bold;">Instagram</a> |
          <a href="https://www.tiktok.com/@abrigapp3" style="text-decoration: none; margin: 0 10px; color: #2b7a78; font-weight: bold;">TikTok</a> |
          <a href="https://www.facebook.com/profile.php?id=61593364442497" style="text-decoration: none; margin: 0 10px; color: #2b7a78; font-weight: bold;">Facebook</a>
        </div>
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

export const sendReportEmail = async (type: string, name: string, reason: string, id: string) => {
  const targetLabel = type === 'business' ? 'Comercio/Tienda' : 'Producto';
  const mailOptions = {
    from: `"AbrigApp Sistema" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: 'abrigappcolombia@gmail.com',
    subject: `NUEVO REPORTE: ${targetLabel} reportado en AbrigApp`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 1px solid #ddd; border-radius: 5px; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://abrigapp-co.vercel.app/logo.png" alt="AbrigApp Logo" style="width: 60px; height: 60px; border-radius: 50%;">
        </div>
        <h2 style="color: #d9534f; text-align: center;">⚠️ Alerta de Reporte de Usuario</h2>
        <p>Se ha recibido un nuevo reporte desde la plataforma pública:</p>
        <ul>
          <li><strong>Tipo:</strong> ${targetLabel}</li>
          <li><strong>Nombre:</strong> ${name}</li>
          <li><strong>ID de Base de Datos:</strong> <code>${id}</code></li>
        </ul>
        <h3>Razón del reporte:</h3>
        <p style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #d9534f; font-style: italic;">
          "${reason}"
        </p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://abrigapp-co.vercel.app/super-admin.html" style="background-color: #2b7a78; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ir al Panel de Super Admin</a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <div style="text-align: center;">
          <p style="font-size: 12px; color: #999;">AbrigApp - Colombia</p>
          <a href="https://www.instagram.com/abrigappcolombia/" style="text-decoration: none; margin: 0 5px; color: #999; font-size: 12px;">Instagram</a>
          <a href="https://www.tiktok.com/@abrigapp3" style="text-decoration: none; margin: 0 5px; color: #999; font-size: 12px;">TikTok</a>
          <a href="https://www.facebook.com/profile.php?id=61593364442497" style="text-decoration: none; margin: 0 5px; color: #999; font-size: 12px;">Facebook</a>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Report email sent for ${type} ${id}`);
  } catch (error) {
    console.error(`Error sending report email:`, error);
    throw error;
  }
};
