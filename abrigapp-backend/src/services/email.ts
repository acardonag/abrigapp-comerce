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
          <img src="https://abrigapp-co.vercel.app/logo_abrigapp.jpg" alt="AbrigApp Logo" style="width: 80px; height: 80px; border-radius: 50%;">
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
          <img src="https://abrigapp-co.vercel.app/logo_abrigapp.jpg" alt="AbrigApp Logo" style="width: 60px; height: 60px; border-radius: 50%;">
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

export const sendSupportVerificationEmail = async (to: string, name: string, verificationUrl: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"AbrigApp Apoyo" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: to,
      subject: "Verifica tu solicitud de apoyo - AbrigApp",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center; color: #333;">
            <img src="https://www.abrigapp.org/logo_abrigapp.jpg" alt="AbrigApp Logo" style="width: 100px; height: 100px; border-radius: 50%; margin-bottom: 20px;">
            <h2 style="color: #2b7a78;">¡Hola, ${name}!</h2>
            <p style="font-size: 16px;">Hemos recibido tu solicitud en la sección <strong>En busca de apoyo!</strong></p>
            <p style="font-size: 16px;">Para poder continuar con el proceso y enviar tu caso a revisión por parte de nuestros voluntarios, necesitamos verificar que este correo es real.</p>
            
            <div style="margin: 30px 0;">
                <a href="${verificationUrl}" style="background-color: #3aafa9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 18px;">Verificar mi correo</a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 40px;">Si no fuiste tú, puedes ignorar este correo.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <div style="margin-top: 20px;">
                <a href="https://www.instagram.com/abrigappcolombia/" style="margin: 0 10px; color: #2b7a78; text-decoration: none;">Instagram</a>
                <a href="https://www.tiktok.com/@abrigapp3" style="margin: 0 10px; color: #2b7a78; text-decoration: none;">TikTok</a>
                <a href="https://www.facebook.com/profile.php?id=61593364442497" style="margin: 0 10px; color: #2b7a78; text-decoration: none;">Facebook</a>
            </div>
        </div>
      `,
    });
    console.log('Verification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

export const sendNewCaseNotificationToVolunteers = async (bccEmails: string[], caseName: string, city: string) => {
  if (!bccEmails || bccEmails.length === 0) return false;
  
  try {
    const info = await transporter.sendMail({
      from: `"AbrigApp Sistema" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: 'abrigappcolombia@gmail.com', // Hidden main recipient, actual recipients in BCC
      bcc: bccEmails,
      subject: `NUEVO CASO PARA REVISIÓN: ${caseName} en ${city}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://www.abrigapp.org/logo_abrigapp.jpg" alt="AbrigApp Logo" style="width: 80px; height: 80px; border-radius: 50%;">
            </div>
            <h2 style="color: #2b7a78; text-align: center;">¡Atención Voluntarios!</h2>
            <p style="font-size: 16px;">Un nuevo caso ha verificado su correo electrónico y está listo para ser revisado por un voluntario.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #3aafa9; margin: 20px 0;">
                <p><strong>Solicitante:</strong> ${caseName}</p>
                <p><strong>Ciudad:</strong> ${city}</p>
                <p><strong>Estado:</strong> En revisión</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.abrigapp.org/voluntario.html" style="background-color: #3aafa9; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Ir al Panel de Voluntarios</a>
            </div>
            
            <p style="font-size: 13px; color: #666; text-align: center; margin-top: 30px;">Gracias por tu dedicación y apoyo a AbrigApp.</p>
        </div>
      `,
    });
    console.log(`Notification email sent to volunteers. MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending volunteer notification email:', error);
    return false;
  }
};
