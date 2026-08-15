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

export const sendReportEmail = async (type: string, name: string, reason: string, id: string) => {
  const targetLabel = type === 'business' ? 'Comercio/Tienda' : 'Producto';
  const mailOptions = {
    from: `"AbrigApp Sistema" <${process.env.GMAIL_USER}>`,
    to: 'abrigappcolombia@gmail.com',
    subject: `NUEVO REPORTE: ${targetLabel} reportado en AbrigApp`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #d9534f;">⚠️ Alerta de Reporte de Usuario</h2>
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
        <p>Por favor, ingresa al <a href="https://abrigapp-co.vercel.app/super-admin.html">Panel de Super Admin</a> para revisar y tomar acción si es necesario.</p>
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
