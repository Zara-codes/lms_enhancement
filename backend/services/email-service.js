import nodemailer from "nodemailer";
import {SMTP_HOST, SMTP_PORT, MAIL_USER, MAIL_PASSWORD, ADMIN_MAIL} from "../config/index.js";

// brevo website
async function sendMail({ to, from=ADMIN_MAIL, subject, text, html }) {
  console.log(`
    to  : ${to},
    from : ${from},
    text : ${text}
  `);
  let transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: {
      user: "themadsarakhatun@gmail.com",
      pass: "smzn pfcr slxk zzcm",
    },
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

export default sendMail;
