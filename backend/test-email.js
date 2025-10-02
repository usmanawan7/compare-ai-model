// Simple Gmail test script
// Run with: node test-email.js

const nodemailer = require('nodemailer');
require('dotenv').config();

async function testGmailConnection() {
  console.log('🔧 Testing Gmail connection...');
  
  // Check environment variables
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  if (!smtpUser || !smtpPass) {
    console.error('❌ Missing SMTP_USER or SMTP_PASS in .env file');
    return;
  }
  
  console.log(`📧 Using email: ${smtpUser}`);
  console.log(`🔑 Using app password: ${smtpPass.substring(0, 4)}****`);
  
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    
    // Verify connection
    console.log('🔍 Verifying connection...');
    await transporter.verify();
    console.log('✅ Gmail connection successful!');
    
    // Send test email
    const testEmail = process.env.TEST_EMAIL || smtpUser;
    console.log(`📤 Sending test email to: ${testEmail}`);
    
    const info = await transporter.sendMail({
      from: `"AI Playground Test" <${smtpUser}>`,
      to: testEmail,
      subject: '🎉 Gmail Test - AI Playground',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0;">🎉 Gmail Test Successful!</h1>
            <p style="margin: 10px 0 0 0;">Your email service is working correctly</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333;">Email Configuration Details:</h2>
            <ul style="color: #666;">
              <li><strong>SMTP Host:</strong> smtp.gmail.com</li>
              <li><strong>SMTP Port:</strong> 587</li>
              <li><strong>From Email:</strong> ${smtpUser}</li>
              <li><strong>Security:</strong> TLS</li>
            </ul>
            
            <p style="color: #666;">If you received this email, your Gmail integration is working perfectly! 🚀</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              AI Playground Backend - Email Service Test
            </p>
          </div>
        </div>
      `,
      text: 'Gmail test successful! Your email service is working correctly.',
    });
    
    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📬 Check your inbox at: ${testEmail}`);
    
  } catch (error) {
    console.error('❌ Gmail connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Make sure 2-Factor Authentication is enabled');
      console.log('2. Generate a new App Password');
      console.log('3. Use the 16-character App Password (not your regular password)');
      console.log('4. Remove spaces from the App Password');
    }
  }
}

// Run the test
testGmailConnection();
