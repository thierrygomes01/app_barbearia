require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const supabase = require('./supabaseClient');

const app = express();
app.use(express.json());
app.use(cors());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

app.post('/recuperar-senha', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    console.log("Erro: E-mail não fornecido");
    return res.status(400).json({ erro: 'O e-mail não foi fornecido.' });
  }

  console.log(`Recebendo pedido de recuperação de senha para o e-mail: ${email}`);

  try {
    const { error } = await supabase.auth.api.resetPasswordForEmail(email, {
      redirectTo: "exp://z-s2xqm-thierrygoms-8081.exp.direct/recuperarSenha"
    });

    if (error) {
      console.error("Erro ao tentar enviar e-mail de recuperação:", error);
      return res.status(400).json({ erro: 'Erro ao enviar o link de recuperação.' });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Recuperação de senha - Sua Barbearia',
      text: `Olá! Você solicitou a recuperação de sua senha. Clique no link abaixo para redefinir sua senha:\n\n${"exp://z-s2xqm-thierrygoms-8081.exp.direct/recuperarSenha"}\n\nSe você não solicitou essa recuperação, desconsidere este e-mail.`
    };

    await transporter.sendMail(mailOptions);

    console.log('E-mail enviado com sucesso');
    res.status(200).json({ mensagem: 'E-mail enviado com sucesso' });
  } catch (err) {
    console.error('Erro ao processar a solicitação:', err);
    res.status(500).json({ erro: 'Erro ao enviar e-mail' });
  }
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
