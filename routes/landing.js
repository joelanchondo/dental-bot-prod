const express = require('express');
const router = express.Router();

// ==========================================
// 🚀 LANDING PAGE PRINCIPAL - ENTERPRISE EDITION
// ==========================================
router.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BotSaaS - Automatización WhatsApp para Empresas | IA + Citas + Pagos</title>
  <meta name="description" content="Plataforma empresarial de automatización WhatsApp con IA. Reduce costos operativos 60%, atiende 24/7, agenda citas automáticamente. +500 empresas confían en nosotros.">
  <meta name="keywords" content="bot whatsapp, automatización empresarial, chatbot ia, agenda citas whatsapp, whatsapp business api">
  <meta property="og:title" content="BotSaaS - Automatización WhatsApp Empresarial">
  <meta property="og:description" content="Reduce costos operativos 60% con nuestro bot de WhatsApp con IA. +500 empresas ya automatizan su atención.">
  <meta property="og:type" content="website">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {
      --primary: #f59e0b;
      --primary-light: #fbbf24;
      --primary-dark: #d97706;
      --dark-950: #030712;
      --dark-900: #0f172a;
      --dark-800: #1e293b;
      --dark-700: #334155;
      --dark-600: #475569;
      --light-100: #f1f5f9;
      --light-200: #e2e8f0;
      --success: #10b981;
      --accent-purple: #8b5cf6;
      --accent-blue: #3b82f6;
      --accent-pink: #ec4899;
      --accent-cyan: #06b6d4;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--dark-950);
      color: #fff;
      overflow-x: hidden;
      line-height: 1.6;
    }

    /* ===== ANIMACIONES ===== */
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(-2deg); }
      50% { transform: translateY(-20px) rotate(-2deg); }
    }

    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.3); }
      50% { box-shadow: 0 0 50px rgba(245, 158, 11, 0.6); }
    }

    @keyframes slide-up {
      from { opacity: 0; transform: translateY(40px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes gradient-shift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    @keyframes scroll-left {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    @keyframes count-up {
      from { opacity: 0; transform: scale(0.5); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    @keyframes ping {
      75%, 100% { transform: scale(2); opacity: 0; }
    }

    .animate-on-scroll {
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .animate-on-scroll.visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* ===== NAVBAR ===== */
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      padding: 16px 0;
      transition: all 0.3s ease;
    }

    .navbar.scrolled {
      background: rgba(3, 7, 18, 0.95);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding: 12px 0;
    }

    .nav-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 26px;
      font-weight: 800;
      color: #fff;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .logo span {
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .nav-links {
      display: flex;
      gap: 40px;
      list-style: none;
    }

    .nav-links a {
      color: #94a3b8;
      text-decoration: none;
      font-weight: 500;
      font-size: 15px;
      transition: color 0.3s;
      position: relative;
    }

    .nav-links a:hover { color: #fff; }

    .nav-links a::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 0;
      height: 2px;
      background: var(--primary);
      transition: width 0.3s;
    }

    .nav-links a:hover::after { width: 100%; }

    .nav-cta {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .btn {
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      transition: all 0.3s ease;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-ghost {
      background: transparent;
      color: #94a3b8;
    }

    .btn-ghost:hover { color: #fff; }

    .btn-outline {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
    }

    .btn-outline:hover {
      border-color: var(--primary);
      color: var(--primary);
      background: rgba(245, 158, 11, 0.1);
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: #000;
      font-weight: 700;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 40px rgba(245, 158, 11, 0.4);
    }

    .btn-large {
      padding: 16px 32px;
      font-size: 16px;
      border-radius: 12px;
    }

    .btn-xl {
      padding: 20px 40px;
      font-size: 18px;
      border-radius: 14px;
    }

    /* ===== HERO ===== */
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      position: relative;
      overflow: hidden;
      padding: 140px 0 80px;
    }

    .hero-bg {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245, 158, 11, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 20% 60%, rgba(59, 130, 246, 0.08) 0%, transparent 40%);
    }

    .hero-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 80px 80px;
      mask-image: radial-gradient(ellipse 100% 60% at 50% 0%, black 40%, transparent 100%);
    }

    .hero-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 32px;
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 80px;
      align-items: center;
      position: relative;
      z-index: 1;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.2);
      color: var(--primary);
      padding: 8px 16px;
      border-radius: 50px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 24px;
    }

    .hero-badge .pulse {
      width: 8px;
      height: 8px;
      background: var(--success);
      border-radius: 50%;
      position: relative;
    }

    .hero-badge .pulse::before {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--success);
      border-radius: 50%;
      animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
    }

    .hero-content h1 {
      font-size: 64px;
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 24px;
      letter-spacing: -0.02em;
    }

    .hero-content h1 .highlight {
      background: linear-gradient(135deg, var(--primary), var(--accent-purple), var(--accent-blue));
      background-size: 200% 200%;
      animation: gradient-shift 5s ease infinite;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-content .subtitle {
      font-size: 20px;
      color: #94a3b8;
      line-height: 1.7;
      margin-bottom: 16px;
      max-width: 540px;
    }

    .hero-metrics {
      display: flex;
      gap: 32px;
      margin-bottom: 40px;
      padding: 20px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .hero-metric {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .hero-metric-icon {
      width: 44px;
      height: 44px;
      background: rgba(16, 185, 129, 0.1);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--success);
      font-size: 18px;
    }

    .hero-metric-text strong {
      display: block;
      font-size: 20px;
      font-weight: 700;
      color: #fff;
    }

    .hero-metric-text span {
      font-size: 13px;
      color: #64748b;
    }

    .hero-buttons {
      display: flex;
      gap: 16px;
      margin-bottom: 32px;
    }

    .hero-trust {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .hero-avatars {
      display: flex;
    }

    .hero-avatars img {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px solid var(--dark-950);
      margin-left: -10px;
      object-fit: cover;
    }

    .hero-avatars img:first-child { margin-left: 0; }

    .hero-trust-text {
      font-size: 14px;
      color: #64748b;
    }

    .hero-trust-text strong {
      color: #fff;
    }

    /* ===== PHONE MOCKUP ===== */
    .hero-visual {
      display: flex;
      justify-content: center;
      perspective: 1000px;
    }

    .phone-mockup {
      width: 340px;
      height: 680px;
      background: linear-gradient(145deg, #1e293b, #0f172a);
      border-radius: 48px;
      padding: 12px;
      box-shadow:
        0 0 0 1px rgba(255, 255, 255, 0.1),
        0 60px 120px rgba(0, 0, 0, 0.6),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      animation: float 6s ease-in-out infinite;
      transform: rotateY(-8deg) rotateX(5deg);
      position: relative;
    }

    .phone-mockup::before {
      content: '';
      position: absolute;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      width: 100px;
      height: 24px;
      background: #000;
      border-radius: 20px;
    }

    .phone-screen {
      width: 100%;
      height: 100%;
      background: #075e54;
      border-radius: 40px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .phone-header {
      background: #075e54;
      padding: 60px 16px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .phone-avatar {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }

    .phone-title {
      flex: 1;
    }

    .phone-title h4 {
      font-size: 15px;
      font-weight: 600;
    }

    .phone-title span {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .phone-title span::before {
      content: '';
      width: 8px;
      height: 8px;
      background: #25D366;
      border-radius: 50%;
    }

    .phone-chat {
      flex: 1;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2V36h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"), #ece5dd;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .chat-bubble {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13px;
      color: #000;
      animation: slide-up 0.5s ease forwards;
      opacity: 0;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .chat-bubble.received {
      background: #fff;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }

    .chat-bubble.sent {
      background: #dcf8c6;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }

    .chat-bubble:nth-child(1) { animation-delay: 0.5s; }
    .chat-bubble:nth-child(2) { animation-delay: 1.5s; }
    .chat-bubble:nth-child(3) { animation-delay: 2.5s; }
    .chat-bubble:nth-child(4) { animation-delay: 3.5s; }
    .chat-bubble:nth-child(5) { animation-delay: 4.5s; }

    /* ===== LOGOS SECTION ===== */
    .logos-section {
      padding: 60px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      background: rgba(255, 255, 255, 0.01);
    }

    .logos-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 32px;
    }

    .logos-title {
      text-align: center;
      font-size: 14px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 40px;
    }

    .logos-grid {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 60px;
      flex-wrap: wrap;
    }

    .logo-item {
      display: flex;
      align-items: center;
      gap: 12px;
      opacity: 0.5;
      transition: opacity 0.3s;
      filter: grayscale(100%);
    }

    .logo-item:hover {
      opacity: 1;
      filter: grayscale(0%);
    }

    .logo-item-icon {
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .logo-item-text {
      font-size: 18px;
      font-weight: 700;
      color: #fff;
    }

    /* ===== STATS BAR ===== */
    .stats-bar {
      padding: 80px 0;
      background: linear-gradient(180deg, var(--dark-950) 0%, var(--dark-900) 100%);
    }

    .stats-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 32px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 40px;
    }

    .stat-item {
      text-align: center;
      padding: 32px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      transition: all 0.3s;
    }

    .stat-item:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(245, 158, 11, 0.2);
      transform: translateY(-4px);
    }

    .stat-number {
      font-size: 48px;
      font-weight: 800;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 15px;
      color: #64748b;
    }

    /* ===== SECTION HEADERS ===== */
    .section-header {
      text-align: center;
      max-width: 800px;
      margin: 0 auto 60px;
      padding: 0 32px;
    }

    .section-tag {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.2);
      color: var(--primary);
      padding: 8px 20px;
      border-radius: 50px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .section-title {
      font-size: 48px;
      font-weight: 800;
      margin-bottom: 20px;
      letter-spacing: -0.02em;
    }

    .section-subtitle {
      font-size: 18px;
      color: #94a3b8;
      line-height: 1.7;
    }

    /* ===== FEATURES ===== */
    .features {
      padding: 120px 0;
      background: var(--dark-900);
    }

    .features-grid {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 32px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .feature-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 24px;
      padding: 40px;
      transition: all 0.4s ease;
      position: relative;
      overflow: hidden;
    }

    .feature-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--primary), transparent);
      opacity: 0;
      transition: opacity 0.4s;
    }

    .feature-card:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(245, 158, 11, 0.3);
      transform: translateY(-8px);
    }

    .feature-card:hover::before { opacity: 1; }

    .feature-icon {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05));
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      margin-bottom: 24px;
    }

    .feature-card h3 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .feature-card p {
      font-size: 15px;
      color: #94a3b8;
      line-height: 1.7;
    }

    /* ===== ROI CALCULATOR ===== */
    .roi-section {
      padding: 120px 0;
      background: linear-gradient(180deg, var(--dark-900) 0%, var(--dark-950) 100%);
      position: relative;
      overflow: hidden;
    }

    .roi-section::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 800px;
      height: 800px;
      background: radial-gradient(circle, rgba(245, 158, 11, 0.05) 0%, transparent 70%);
      pointer-events: none;
    }

    .roi-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 32px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 80px;
      align-items: center;
      position: relative;
      z-index: 1;
    }

    .roi-content h2 {
      font-size: 44px;
      font-weight: 800;
      margin-bottom: 20px;
      letter-spacing: -0.02em;
    }

    .roi-content p {
      font-size: 18px;
      color: #94a3b8;
      margin-bottom: 32px;
      line-height: 1.7;
    }

    .roi-benefits {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .roi-benefit {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 16px;
    }

    .roi-benefit i {
      color: var(--success);
      font-size: 18px;
    }

    .roi-calculator {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 28px;
      padding: 40px;
    }

    .roi-calculator h3 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 32px;
      text-align: center;
    }

    .roi-input-group {
      margin-bottom: 24px;
    }

    .roi-input-group label {
      display: block;
      font-size: 14px;
      color: #94a3b8;
      margin-bottom: 8px;
    }

    .roi-input-wrapper {
      position: relative;
    }

    .roi-input-wrapper span {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
      font-size: 16px;
    }

    .roi-input {
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      padding-left: 36px;
      font-size: 18px;
      font-weight: 600;
      color: #fff;
      outline: none;
      transition: all 0.3s;
    }

    .roi-input:focus {
      border-color: var(--primary);
      background: rgba(245, 158, 11, 0.05);
    }

    .roi-slider {
      -webkit-appearance: none;
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      outline: none;
      margin-top: 8px;
    }

    .roi-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 24px;
      height: 24px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    }

    .roi-results {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      margin-top: 32px;
    }

    .roi-results-label {
      font-size: 14px;
      color: #94a3b8;
      margin-bottom: 8px;
    }

    .roi-results-value {
      font-size: 40px;
      font-weight: 800;
      color: var(--success);
    }

    .roi-results-sub {
      font-size: 14px;
      color: #64748b;
      margin-top: 4px;
    }

    /* ===== TESTIMONIALS ===== */
    .testimonials {
      padding: 120px 0;
      background: var(--dark-800);
    }

    .testimonials-grid {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 32px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 32px;
    }

    .testimonial-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 24px;
      padding: 40px;
      transition: all 0.4s;
    }

    .testimonial-card:hover {
      background: rgba(255, 255, 255, 0.04);
      transform: translateY(-8px);
    }

    .testimonial-card.featured {
      background: linear-gradient(145deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.02));
      border-color: rgba(245, 158, 11, 0.2);
    }

    .testimonial-stars {
      color: #fbbf24;
      margin-bottom: 20px;
      font-size: 18px;
    }

    .testimonial-text {
      font-size: 17px;
      line-height: 1.8;
      color: #e2e8f0;
      margin-bottom: 28px;
    }

    .testimonial-author {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .testimonial-avatar {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, var(--primary), var(--accent-purple));
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .testimonial-info h4 {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .testimonial-info span {
      font-size: 14px;
      color: #64748b;
    }

    .testimonial-metric {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .testimonial-metric-value {
      font-size: 28px;
      font-weight: 800;
      color: var(--success);
    }

    .testimonial-metric-label {
      font-size: 14px;
      color: #64748b;
    }

    /* ===== INDUSTRIES ===== */
    .industries {
      padding: 120px 0;
      background: linear-gradient(180deg, var(--dark-800) 0%, var(--dark-900) 100%);
      overflow: hidden;
    }

    .carousel-container {
      position: relative;
      width: 100%;
      overflow: hidden;
      margin-top: 60px;
    }

    .carousel-track {
      display: flex;
      gap: 24px;
      animation: scroll-left 40s linear infinite;
      width: max-content;
    }

    .carousel-track:hover { animation-play-state: paused; }

    .industry-card {
      width: 300px;
      flex-shrink: 0;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 24px;
      padding: 36px;
      text-align: center;
      transition: all 0.4s ease;
    }

    .industry-card:hover {
      transform: translateY(-8px);
      border-color: var(--primary);
      box-shadow: 0 20px 50px rgba(245, 158, 11, 0.15);
    }

    .industry-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
    }

    .industry-card h3 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .industry-card p {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.6;
    }

    /* ===== SECURITY SECTION ===== */
    .security {
      padding: 120px 0;
      background: var(--dark-900);
      position: relative;
      overflow: hidden;
    }

    .security::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background:
        radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 40%);
    }

    .security-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 32px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 80px;
      align-items: center;
      position: relative;
      z-index: 1;
    }

    .security-content h2 {
      font-size: 44px;
      font-weight: 800;
      margin-bottom: 20px;
      letter-spacing: -0.02em;
    }

    .security-content h2 .gradient {
      background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .security-content > p {
      font-size: 18px;
      color: #94a3b8;
      line-height: 1.7;
      margin-bottom: 40px;
    }

    .security-features {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .security-feature {
      display: flex;
      gap: 20px;
    }

    .security-feature-icon {
      width: 52px;
      height: 52px;
      background: rgba(16, 185, 129, 0.1);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .security-feature-icon i {
      font-size: 22px;
      color: var(--success);
    }

    .security-feature-icon.purple {
      background: rgba(139, 92, 246, 0.1);
    }

    .security-feature-icon.purple i { color: var(--accent-purple); }

    .security-feature-icon.blue {
      background: rgba(59, 130, 246, 0.1);
    }

    .security-feature-icon.blue i { color: var(--accent-blue); }

    .security-feature-icon.orange {
      background: rgba(245, 158, 11, 0.1);
    }

    .security-feature-icon.orange i { color: var(--primary); }

    .security-feature-text h4 {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 6px;
    }

    .security-feature-text p {
      font-size: 15px;
      color: #94a3b8;
      line-height: 1.6;
    }

    .security-visual {
      position: relative;
    }

    .security-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 28px;
      padding: 40px;
    }

    .security-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      margin-bottom: 28px;
    }

    .security-card-side {
      text-align: center;
      flex: 1;
    }

    .security-card-side.bad { opacity: 0.4; }

    .security-card-side .icon {
      font-size: 36px;
      margin-bottom: 12px;
    }

    .security-card-side h5 {
      font-size: 14px;
      font-weight: 600;
      color: #94a3b8;
    }

    .security-card-side.bad h5 { color: #64748b; }

    .security-card-side p {
      font-size: 12px;
      color: #475569;
      margin-top: 4px;
    }

    .security-card-divider {
      width: 1px;
      height: 60px;
      background: rgba(255, 255, 255, 0.1);
      margin: 0 24px;
    }

    .security-items {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .security-item {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .security-item-indicator {
      width: 10px;
      height: 10px;
      background: var(--success);
      border-radius: 50%;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.5);
    }

    .security-item-content {
      flex: 1;
    }

    .security-item-content .bar {
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      margin-bottom: 6px;
      width: 120px;
    }

    .security-item-content .bar-2 {
      height: 6px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 3px;
      width: 180px;
    }

    .security-item i {
      color: rgba(255, 255, 255, 0.1);
      font-size: 20px;
    }

    .security-card-quote {
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      text-align: center;
    }

    .security-card-quote p {
      font-size: 15px;
      font-style: italic;
      color: #94a3b8;
      margin-bottom: 12px;
    }

    .security-card-quote .stars {
      color: #fbbf24;
      font-size: 14px;
    }

    /* ===== HOW IT WORKS ===== */
    .how-it-works {
      padding: 120px 0;
      background: var(--dark-800);
    }

    .steps-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 32px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      position: relative;
    }

    .steps-container::before {
      content: '';
      position: absolute;
      top: 50px;
      left: 12%;
      right: 12%;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--primary), var(--primary), transparent);
      z-index: 0;
    }

    .step {
      text-align: center;
      position: relative;
      z-index: 1;
    }

    .step-number {
      width: 100px;
      height: 100px;
      margin: 0 auto 24px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      border-radius: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      font-weight: 800;
      color: #000;
      box-shadow: 0 20px 40px rgba(245, 158, 11, 0.3);
    }

    .step h3 {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .step p {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.6;
    }

    /* ===== PRICING ===== */
    .pricing {
      padding: 120px 0;
      background: var(--dark-950);
    }

    .pricing-grid {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 32px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .pricing-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 28px;
      padding: 48px 40px;
      position: relative;
      transition: all 0.4s ease;
    }

    .pricing-card:hover {
      transform: translateY(-8px);
      background: rgba(255, 255, 255, 0.04);
    }

    .pricing-card.popular {
      background: linear-gradient(145deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.02));
      border-color: var(--primary);
      transform: scale(1.02);
    }

    .pricing-card.popular:hover {
      transform: scale(1.02) translateY(-8px);
    }

    .popular-badge {
      position: absolute;
      top: -14px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: #000;
      padding: 8px 24px;
      border-radius: 50px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .pricing-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .pricing-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
    }

    .pricing-name {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .pricing-desc {
      font-size: 14px;
      color: #64748b;
    }

    .pricing-price {
      text-align: center;
      margin-bottom: 32px;
      padding: 24px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .pricing-amount {
      font-size: 56px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .pricing-period {
      font-size: 16px;
      color: #64748b;
    }

    .pricing-features {
      list-style: none;
      margin-bottom: 32px;
    }

    .pricing-features li {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
      font-size: 14px;
      color: #cbd5e1;
    }

    .pricing-features li i {
      width: 20px;
      text-align: center;
    }

    .pricing-features li i.fa-check {
      color: var(--success);
    }

    .pricing-features li.disabled {
      color: #475569;
    }

    .pricing-features li.disabled i {
      color: #475569;
    }

    .btn-block {
      width: 100%;
      text-align: center;
      justify-content: center;
    }

    /* ===== FAQ ===== */
    .faq {
      padding: 120px 0;
      background: var(--dark-900);
    }

    .faq-grid {
      max-width: 800px;
      margin: 0 auto;
      padding: 0 32px;
    }

    .faq-item {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .faq-question {
      width: 100%;
      background: none;
      border: none;
      padding: 24px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      text-align: left;
    }

    .faq-question h4 {
      font-size: 18px;
      font-weight: 600;
      color: #fff;
    }

    .faq-question i {
      color: var(--primary);
      font-size: 16px;
      transition: transform 0.3s;
    }

    .faq-item.active .faq-question i {
      transform: rotate(180deg);
    }

    .faq-answer {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s, padding 0.3s;
    }

    .faq-item.active .faq-answer {
      max-height: 200px;
      padding-bottom: 24px;
    }

    .faq-answer p {
      font-size: 16px;
      color: #94a3b8;
      line-height: 1.7;
    }

    /* ===== CTA ===== */
    .cta {
      padding: 140px 0;
      background:
        radial-gradient(ellipse 80% 50% at 50% 100%, rgba(245, 158, 11, 0.15) 0%, transparent 50%),
        var(--dark-950);
      position: relative;
    }

    .cta-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 0 32px;
      text-align: center;
    }

    .cta-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      color: var(--success);
      padding: 8px 16px;
      border-radius: 50px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 24px;
    }

    .cta h2 {
      font-size: 52px;
      font-weight: 800;
      margin-bottom: 20px;
      letter-spacing: -0.02em;
    }

    .cta p {
      font-size: 20px;
      color: #94a3b8;
      margin-bottom: 40px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .cta-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
      margin-bottom: 40px;
    }

    .cta-trust {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 32px;
      flex-wrap: wrap;
    }

    .cta-trust-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #64748b;
    }

    .cta-trust-item i {
      color: var(--success);
    }

    /* ===== FOOTER ===== */
    .footer {
      background: var(--dark-800);
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding: 80px 0 40px;
    }

    .footer-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 32px;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
      gap: 60px;
      margin-bottom: 60px;
    }

    .footer-brand p {
      color: #64748b;
      margin-top: 20px;
      line-height: 1.7;
      font-size: 15px;
    }

    .footer-badges {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .footer-badge {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .footer-badge i { color: var(--success); }

    .footer-links h4 {
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 24px;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .footer-links ul {
      list-style: none;
    }

    .footer-links li {
      margin-bottom: 14px;
    }

    .footer-links a {
      color: #64748b;
      text-decoration: none;
      font-size: 14px;
      transition: color 0.3s;
    }

    .footer-links a:hover {
      color: var(--primary);
    }

    .footer-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 40px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .footer-bottom p {
      color: #475569;
      font-size: 14px;
    }

    .social-links {
      display: flex;
      gap: 12px;
    }

    .social-links a {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.3s;
    }

    .social-links a:hover {
      background: var(--primary);
      border-color: var(--primary);
      color: #000;
    }

    /* ===== MOBILE MENU ===== */
    .mobile-menu-btn {
      display: none;
      background: none;
      border: none;
      color: #fff;
      font-size: 24px;
      cursor: pointer;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 1200px) {
      .hero-content h1 { font-size: 52px; }
      .hero-container { gap: 60px; }
      .footer-grid { grid-template-columns: 2fr 1fr 1fr 1fr; }
    }

    @media (max-width: 1024px) {
      .hero-container { grid-template-columns: 1fr; text-align: center; }
      .hero-visual { margin-top: 60px; }
      .hero-buttons { justify-content: center; }
      .hero-metrics { justify-content: center; }
      .hero-trust { justify-content: center; }
      .hero-content .subtitle { margin-left: auto; margin-right: auto; }
      .features-grid { grid-template-columns: repeat(2, 1fr); }
      .pricing-grid { grid-template-columns: 1fr; max-width: 440px; }
      .pricing-card.popular { transform: none; }
      .pricing-card.popular:hover { transform: translateY(-8px); }
      .steps-container { grid-template-columns: repeat(2, 1fr); }
      .steps-container::before { display: none; }
      .testimonials-grid { grid-template-columns: 1fr; max-width: 500px; margin-left: auto; margin-right: auto; }
      .roi-container { grid-template-columns: 1fr; }
      .roi-content { text-align: center; }
      .security-container { grid-template-columns: 1fr; }
      .security-content { text-align: center; }
      .security-features { max-width: 500px; margin: 0 auto; }
      .stats-container { grid-template-columns: repeat(2, 1fr); }
      .footer-grid { grid-template-columns: 1fr 1fr; }
    }

    @media (max-width: 768px) {
      .nav-links { display: none; }
      .mobile-menu-btn { display: block; }
      .hero { padding: 120px 0 60px; }
      .hero-content h1 { font-size: 36px; }
      .hero-metrics { flex-direction: column; gap: 16px; }
      .section-title { font-size: 32px; }
      .features-grid { grid-template-columns: 1fr; }
      .steps-container { grid-template-columns: 1fr; }
      .logos-grid { gap: 32px; }
      .footer-grid { grid-template-columns: 1fr; text-align: center; }
      .footer-badges { justify-content: center; }
      .footer-bottom { flex-direction: column; gap: 20px; text-align: center; }
      .cta h2 { font-size: 36px; }
      .cta-buttons { flex-direction: column; }
      .cta-trust { flex-direction: column; gap: 16px; }
      .hero-buttons { flex-direction: column; }
      .btn-xl { width: 100%; justify-content: center; }
    }
  </style>
</head>
<body>

  <!-- NAVBAR -->
  <nav class="navbar" id="navbar">
    <div class="nav-container">
      <a href="/" class="logo">
        <div class="logo-icon">🤖</div>
        Bot<span>SaaS</span>
      </a>
      <ul class="nav-links">
        <li><a href="#features">Características</a></li>
        <li><a href="#industries">Industrias</a></li>
        <li><a href="#testimonials">Casos de Éxito</a></li>
        <li><a href="#pricing">Precios</a></li>
      </ul>
      <div class="nav-cta">
        <a href="/auth/login" class="btn btn-ghost">Iniciar Sesión</a>
        <a href="/auth/register" class="btn btn-primary">Prueba Gratis</a>
      </div>
      <button class="mobile-menu-btn" id="mobileMenuBtn">
        <i class="fas fa-bars"></i>
      </button>
    </div>
  </nav>

  <!-- HERO -->
  <section class="hero">
    <div class="hero-bg"></div>
    <div class="hero-grid"></div>
    <div class="hero-container">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="pulse"></span>
          +500 empresas ya automatizan con IA
        </div>
        <h1>
          Automatiza tu atención con<br>
          <span class="highlight">WhatsApp + IA</span>
        </h1>
        <p class="subtitle">
          Reduce costos operativos hasta 60%. Tu bot atiende clientes, agenda citas y cobra pagos 24/7 mientras tú te enfocas en crecer.
        </p>

        <div class="hero-metrics">
          <div class="hero-metric">
            <div class="hero-metric-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="hero-metric-text">
              <strong>-60%</strong>
              <span>Costos operativos</span>
            </div>
          </div>
          <div class="hero-metric">
            <div class="hero-metric-icon">
              <i class="fas fa-reply"></i>
            </div>
            <div class="hero-metric-text">
              <strong>3 seg</strong>
              <span>Tiempo de respuesta</span>
            </div>
          </div>
          <div class="hero-metric">
            <div class="hero-metric-icon">
              <i class="fas fa-calendar-check"></i>
            </div>
            <div class="hero-metric-text">
              <strong>+40%</strong>
              <span>Más citas agendadas</span>
            </div>
          </div>
        </div>

        <div class="hero-buttons">
          <a href="/auth/register" class="btn btn-primary btn-xl">
            Empezar Prueba Gratis
            <i class="fas fa-arrow-right"></i>
          </a>
          <a href="#demo" class="btn btn-outline btn-large">
            <i class="fas fa-play"></i>
            Ver Demo
          </a>
        </div>

        <div class="hero-trust">
          <div class="hero-avatars">
            <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Usuario">
            <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Usuario">
            <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Usuario">
            <img src="https://randomuser.me/api/portraits/men/75.jpg" alt="Usuario">
          </div>
          <div class="hero-trust-text">
            <strong>4.9/5</strong> de +500 empresas
          </div>
        </div>
      </div>

      <div class="hero-visual">
        <div class="phone-mockup">
          <div class="phone-screen">
            <div class="phone-header">
              <div class="phone-avatar">🦷</div>
              <div class="phone-title">
                <h4>Clínica Dental Sonrisa</h4>
                <span>Bot activo</span>
              </div>
            </div>
            <div class="phone-chat">
              <div class="chat-bubble received">¡Hola! 👋 Soy el asistente de Clínica Sonrisa. ¿En qué puedo ayudarte hoy?</div>
              <div class="chat-bubble sent">Quiero agendar una limpieza dental</div>
              <div class="chat-bubble received">¡Perfecto! 🦷 Tenemos disponibilidad mañana. ¿Prefieres 10:00 AM o 3:00 PM?</div>
              <div class="chat-bubble sent">A las 10:00 AM por favor</div>
              <div class="chat-bubble received">✅ ¡Listo! Tu cita está confirmada para mañana a las 10:00 AM. Te enviaré un recordatorio. ¿Deseas pagar ahora o en clínica?</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- LOGOS -->
  <section class="logos-section">
    <div class="logos-container">
      <p class="logos-title">Empresas que confían en BotSaaS</p>
      <div class="logos-grid">
        <div class="logo-item">
          <div class="logo-item-icon">🦷</div>
          <span class="logo-item-text">DentalCare</span>
        </div>
        <div class="logo-item">
          <div class="logo-item-icon">💆</div>
          <span class="logo-item-text">ZenSpa</span>
        </div>
        <div class="logo-item">
          <div class="logo-item-icon">💈</div>
          <span class="logo-item-text">BarberKing</span>
        </div>
        <div class="logo-item">
          <div class="logo-item-icon">🏥</div>
          <span class="logo-item-text">MediPlus</span>
        </div>
        <div class="logo-item">
          <div class="logo-item-icon">💅</div>
          <span class="logo-item-text">NailsArt</span>
        </div>
        <div class="logo-item">
          <div class="logo-item-icon">🚗</div>
          <span class="logo-item-text">AutoService</span>
        </div>
      </div>
    </div>
  </section>

  <!-- STATS BAR -->
  <section class="stats-bar">
    <div class="stats-container">
      <div class="stat-item animate-on-scroll">
        <div class="stat-number">500+</div>
        <div class="stat-label">Empresas activas</div>
      </div>
      <div class="stat-item animate-on-scroll">
        <div class="stat-number">2M+</div>
        <div class="stat-label">Mensajes procesados</div>
      </div>
      <div class="stat-item animate-on-scroll">
        <div class="stat-number">98%</div>
        <div class="stat-label">Satisfacción cliente</div>
      </div>
      <div class="stat-item animate-on-scroll">
        <div class="stat-number">24/7</div>
        <div class="stat-label">Disponibilidad</div>
      </div>
    </div>
  </section>

  <!-- FEATURES -->
  <section class="features" id="features">
    <div class="section-header">
      <span class="section-tag"><i class="fas fa-bolt"></i> Funcionalidades</span>
      <h2 class="section-title">Todo lo que necesitas para automatizar</h2>
      <p class="section-subtitle">Herramientas empresariales que trabajan por ti las 24 horas, los 7 días de la semana</p>
    </div>
    <div class="features-grid">
      <div class="feature-card animate-on-scroll">
        <div class="feature-icon">💬</div>
        <h3>Respuestas con IA</h3>
        <p>Conversaciones naturales potenciadas por Claude AI. Tu bot entiende contexto, resuelve dudas complejas y nunca pierde la paciencia.</p>
      </div>
      <div class="feature-card animate-on-scroll">
        <div class="feature-icon">📅</div>
        <h3>Agenda Inteligente</h3>
        <p>Tus clientes agendan solos con disponibilidad en tiempo real. Sin llamadas, sin confusiones, sin doble reserva.</p>
      </div>
      <div class="feature-card animate-on-scroll">
        <div class="feature-icon">🔔</div>
        <h3>Recordatorios Automáticos</h3>
        <p>Reduce faltas hasta 80%. Recordatorios por WhatsApp 24h y 1h antes. Confirmación con un solo mensaje.</p>
      </div>
      <div class="feature-card animate-on-scroll">
        <div class="feature-icon">💳</div>
        <h3>Cobros Integrados</h3>
        <p>Cobra anticipos o pagos completos desde el chat. Integración nativa con MercadoPago y Stripe.</p>
      </div>
      <div class="feature-card animate-on-scroll">
        <div class="feature-icon">📊</div>
        <h3>Dashboard Analítico</h3>
        <p>Visualiza citas, ingresos y métricas clave. Toma decisiones basadas en datos reales de tu negocio.</p>
      </div>
      <div class="feature-card animate-on-scroll">
        <div class="feature-icon">🔗</div>
        <h3>Google Calendar Sync</h3>
        <p>Sincronización bidireccional con tu calendario. Todas tus citas en un solo lugar, siempre actualizadas.</p>
      </div>
    </div>
  </section>

  <!-- ROI CALCULATOR -->
  <section class="roi-section" id="roi">
    <div class="roi-container">
      <div class="roi-content animate-on-scroll">
        <h2>¿Cuánto puedes ahorrar con BotSaaS?</h2>
        <p>Calcula el retorno de inversión basado en las métricas de tu negocio actual. La mayoría de nuestros clientes recuperan la inversión en el primer mes.</p>
        <div class="roi-benefits">
          <div class="roi-benefit">
            <i class="fas fa-check-circle"></i>
            <span>Ahorra hasta 120 horas/mes en atención manual</span>
          </div>
          <div class="roi-benefit">
            <i class="fas fa-check-circle"></i>
            <span>Reduce 80% las citas perdidas</span>
          </div>
          <div class="roi-benefit">
            <i class="fas fa-check-circle"></i>
            <span>Aumenta 40% las reservas mensuales</span>
          </div>
          <div class="roi-benefit">
            <i class="fas fa-check-circle"></i>
            <span>Atiende clientes fuera de horario laboral</span>
          </div>
        </div>
      </div>
      <div class="roi-calculator animate-on-scroll">
        <h3>💰 Calculadora de Ahorro</h3>
        <div class="roi-input-group">
          <label>Citas mensuales actuales</label>
          <div class="roi-input-wrapper">
            <input type="number" class="roi-input" id="roiCitas" value="100" min="10" max="1000">
          </div>
          <input type="range" class="roi-slider" id="roiCitasSlider" value="100" min="10" max="500">
        </div>
        <div class="roi-input-group">
          <label>Precio promedio por servicio (MXN)</label>
          <div class="roi-input-wrapper">
            <span>$</span>
            <input type="number" class="roi-input" id="roiPrecio" value="500" min="100" max="5000">
          </div>
          <input type="range" class="roi-slider" id="roiPrecioSlider" value="500" min="100" max="3000">
        </div>
        <div class="roi-results">
          <div class="roi-results-label">Ahorro mensual estimado</div>
          <div class="roi-results-value" id="roiResult">$12,000</div>
          <div class="roi-results-sub">Basado en reducción de faltas y aumento de citas</div>
        </div>
      </div>
    </div>
  </section>

  <!-- TESTIMONIALS -->
  <section class="testimonials" id="testimonials">
    <div class="section-header">
      <span class="section-tag"><i class="fas fa-star"></i> Casos de Éxito</span>
      <h2 class="section-title">Lo que dicen nuestros clientes</h2>
      <p class="section-subtitle">Empresas reales con resultados medibles</p>
    </div>
    <div class="testimonials-grid">
      <div class="testimonial-card featured animate-on-scroll">
        <div class="testimonial-stars">
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
        </div>
        <p class="testimonial-text">"Antes perdíamos 30% de citas por faltas. Ahora con los recordatorios automáticos bajamos a 5%. El bot se paga solo cada mes."</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">🦷</div>
          <div class="testimonial-info">
            <h4>Dr. Roberto Méndez</h4>
            <span>Clínica Dental Sonrisa, CDMX</span>
          </div>
        </div>
        <div class="testimonial-metric">
          <div class="testimonial-metric-value">-83%</div>
          <div class="testimonial-metric-label">menos citas perdidas</div>
        </div>
      </div>

      <div class="testimonial-card animate-on-scroll">
        <div class="testimonial-stars">
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
        </div>
        <p class="testimonial-text">"Mi recepcionista ahora se enfoca en atención presencial. El bot maneja el 80% de consultas de WhatsApp sin intervención."</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">💆</div>
          <div class="testimonial-info">
            <h4>María González</h4>
            <span>Zen Spa & Wellness, Monterrey</span>
          </div>
        </div>
        <div class="testimonial-metric">
          <div class="testimonial-metric-value">80%</div>
          <div class="testimonial-metric-label">consultas automatizadas</div>
        </div>
      </div>

      <div class="testimonial-card animate-on-scroll">
        <div class="testimonial-stars">
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
        </div>
        <p class="testimonial-text">"Abrimos a las 9 pero el bot agenda citas desde las 6 AM. Ganamos clientes que antes iban con la competencia."</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">💈</div>
          <div class="testimonial-info">
            <h4>Carlos Ramírez</h4>
            <span>BarberKing, Guadalajara</span>
          </div>
        </div>
        <div class="testimonial-metric">
          <div class="testimonial-metric-value">+45%</div>
          <div class="testimonial-metric-label">más reservas mensuales</div>
        </div>
      </div>
    </div>
  </section>

  <!-- INDUSTRIES CAROUSEL -->
  <section class="industries" id="industries">
    <div class="section-header">
      <span class="section-tag"><i class="fas fa-building"></i> Industrias</span>
      <h2 class="section-title">Diseñado para tu industria</h2>
      <p class="section-subtitle">Servicios precargados, respuestas optimizadas y flujos específicos para cada tipo de negocio</p>
    </div>
    <div class="carousel-container">
      <div class="carousel-track">
        <div class="industry-card">
          <div class="industry-icon">🦷</div>
          <h3>Clínicas Dentales</h3>
          <p>Limpieza, ortodoncia, blanqueamiento, urgencias y más</p>
        </div>
        <div class="industry-card">
          <div class="industry-icon">🏥</div>
          <h3>Consultorios Médicos</h3>
          <p>Consultas, estudios, vacunación y especialidades</p>
        </div>
        <div class="industry-card">
          <div class="industry-icon">💆</div>
          <h3>Spas & Wellness</h3>
          <p>Masajes, faciales, tratamientos corporales</p>
        </div>
        <div class="industry-card">
          <div class="industry-icon">💅</div>
          <h3>Salones de Uñas</h3>
          <p>Manicure, pedicure, acrílicas, esmaltado</p>
        </div>
        <div class="industry-card">
          <div class="industry-icon">💈</div>
          <h3>Barberías</h3>
          <p>Cortes, barba, tintes y servicios VIP</p>
        </div>
        <div class="industry-card">
          <div class="industry-icon">🚗</div>
          <h3>Talleres Automotrices</h3>
          <p>Afinaciones, frenos, diagnóstico, mantenimiento</p>
        </div>
        <div class="industry-card">
          <div class="industry-icon">🥗</div>
          <h3>Nutriólogos</h3>
          <p>Consultas, planes alimenticios, seguimiento</p>
        </div>
        <div class="industry-card">
          <div class="industry-icon">🏋️</div>
          <h3>Gimnasios</h3>
          <p>Clases, entrenamientos personales, membresías</p>
        </div>
        <!-- Duplicados para efecto infinito -->
        <div class="industry-card">
          <div class="industry-icon">🦷</div>
          <h3>Clínicas Dentales</h3>
          <p>Limpieza, ortodoncia, blanqueamiento, urgencias y más</p>
        </div>
        <div class="industry-card">
          <div class="industry-icon">🏥</div>
          <h3>Consultorios Médicos</h3>
          <p>Consultas, estudios, vacunación y especialidades</p>
        </div>
        <div class="industry-card">
          <div class="industry-icon">💆</div>
          <h3>Spas & Wellness</h3>
          <p>Masajes, faciales, tratamientos corporales</p>
        </div>
        <div class="industry-card">
          <div class="industry-icon">💅</div>
          <h3>Salones de Uñas</h3>
          <p>Manicure, pedicure, acrílicas, esmaltado</p>
        </div>
        <div class="industry-card">
          <div class="industry-icon">💈</div>
          <h3>Barberías</h3>
          <p>Cortes, barba, tintes y servicios VIP</p>
        </div>
        <div class="industry-card">
          <div class="industry-icon">🚗</div>
          <h3>Talleres Automotrices</h3>
          <p>Afinaciones, frenos, diagnóstico, mantenimiento</p>
        </div>
        <div class="industry-card">
          <div class="industry-icon">🥗</div>
          <h3>Nutriólogos</h3>
          <p>Consultas, planes alimenticios, seguimiento</p>
        </div>
        <div class="industry-card">
          <div class="industry-icon">🏋️</div>
          <h3>Gimnasios</h3>
          <p>Clases, entrenamientos personales, membresías</p>
        </div>
      </div>
    </div>
  </section>

  <!-- SECURITY -->
  <section class="security">
    <div class="security-container">
      <div class="security-content animate-on-scroll">
        <h2>Tu vida personal <span class="gradient">separada de tu negocio</span></h2>
        <p>No arriesgues tu número personal ni tus fotos familiares. Te asignamos una línea empresarial oficial verificada por Meta.</p>

        <div class="security-features">
          <div class="security-feature">
            <div class="security-feature-icon">
              <i class="fas fa-shield-alt"></i>
            </div>
            <div class="security-feature-text">
              <h4>API Oficial de WhatsApp</h4>
              <p>Sin riesgo de bloqueos. Usamos la API oficial de Meta, no trucos ni hacks.</p>
            </div>
          </div>

          <div class="security-feature">
            <div class="security-feature-icon purple">
              <i class="fas fa-moon"></i>
            </div>
            <div class="security-feature-text">
              <h4>Descansa de Verdad</h4>
              <p>Tu bot atiende a las 3 AM. Nadie te despertará preguntando precios.</p>
            </div>
          </div>

          <div class="security-feature">
            <div class="security-feature-icon blue">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="security-feature-text">
              <h4>Perfil Verificado</h4>
              <p>Tus clientes ven un perfil empresarial profesional, no una foto personal.</p>
            </div>
          </div>

          <div class="security-feature">
            <div class="security-feature-icon orange">
              <i class="fas fa-lock"></i>
            </div>
            <div class="security-feature-text">
              <h4>Datos Encriptados</h4>
              <p>Toda la información de tus clientes está protegida con encriptación de grado bancario.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="security-visual animate-on-scroll">
        <div class="security-card">
          <div class="security-card-header">
            <div class="security-card-side bad">
              <div class="icon">🚫</div>
              <h5>WhatsApp Personal</h5>
              <p>Mezclado con familia</p>
            </div>
            <div class="security-card-divider"></div>
            <div class="security-card-side">
              <div class="icon">✅</div>
              <h5>BotSaaS Business</h5>
              <p>100% Profesional</p>
            </div>
          </div>

          <div class="security-items">
            <div class="security-item">
              <div class="security-item-indicator"></div>
              <div class="security-item-content">
                <div class="bar"></div>
                <div class="bar-2"></div>
              </div>
              <i class="fab fa-whatsapp"></i>
            </div>
            <div class="security-item">
              <div class="security-item-indicator"></div>
              <div class="security-item-content">
                <div class="bar"></div>
                <div class="bar-2"></div>
              </div>
              <i class="fab fa-whatsapp"></i>
            </div>
            <div class="security-item">
              <div class="security-item-indicator"></div>
              <div class="security-item-content">
                <div class="bar"></div>
                <div class="bar-2"></div>
              </div>
              <i class="fab fa-whatsapp"></i>
            </div>
          </div>

          <div class="security-card-quote">
            <p>"La mejor decisión fue separar mi número personal."</p>
            <div class="stars">
              <i class="fas fa-star"></i>
              <i class="fas fa-star"></i>
              <i class="fas fa-star"></i>
              <i class="fas fa-star"></i>
              <i class="fas fa-star"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- HOW IT WORKS -->
  <section class="how-it-works" id="how-it-works">
    <div class="section-header">
      <span class="section-tag"><i class="fas fa-rocket"></i> Súper Fácil</span>
      <h2 class="section-title">Activo en menos de 5 minutos</h2>
      <p class="section-subtitle">Sin código, sin complicaciones técnicas, sin ayuda de desarrolladores</p>
    </div>
    <div class="steps-container">
      <div class="step animate-on-scroll">
        <div class="step-number">1</div>
        <h3>Crea tu cuenta</h3>
        <p>Regístrate gratis con tu email y datos de negocio</p>
      </div>
      <div class="step animate-on-scroll">
        <div class="step-number">2</div>
        <h3>Elige tu industria</h3>
        <p>Selecciona tu tipo de negocio y los servicios se cargan automáticamente</p>
      </div>
      <div class="step animate-on-scroll">
        <div class="step-number">3</div>
        <h3>Conecta WhatsApp</h3>
        <p>Te asignamos un número empresarial verificado por Meta</p>
      </div>
      <div class="step animate-on-scroll">
        <div class="step-number">4</div>
        <h3>¡Listo!</h3>
        <p>Tu bot ya está atendiendo clientes automáticamente 24/7</p>
      </div>
    </div>
  </section>

  <!-- PRICING -->
  <section class="pricing" id="pricing">
    <div class="section-header">
      <span class="section-tag"><i class="fas fa-tag"></i> Precios</span>
      <h2 class="section-title">Planes simples y transparentes</h2>
      <p class="section-subtitle">Sin sorpresas, sin costos ocultos. Cancela cuando quieras.</p>
    </div>
    <div class="pricing-grid">
      <div class="pricing-card animate-on-scroll">
        <div class="pricing-header">
          <div class="pricing-icon">💬</div>
          <h3 class="pricing-name">Básico</h3>
          <p class="pricing-desc">Para empezar a automatizar</p>
        </div>
        <div class="pricing-price">
          <span class="pricing-amount">$299</span>
          <span class="pricing-period">MXN/mes</span>
        </div>
        <ul class="pricing-features">
          <li><i class="fas fa-check"></i> Respuestas automáticas 24/7</li>
          <li><i class="fas fa-check"></i> Menú de servicios</li>
          <li><i class="fas fa-check"></i> Información de contacto y ubicación</li>
          <li><i class="fas fa-check"></i> Hasta 500 mensajes/mes</li>
          <li class="disabled"><i class="fas fa-times"></i> Agenda de citas</li>
          <li class="disabled"><i class="fas fa-times"></i> Dashboard analítico</li>
          <li class="disabled"><i class="fas fa-times"></i> IA personalizada</li>
        </ul>
        <a href="/auth/register?plan=basico" class="btn btn-outline btn-block btn-large">Empezar</a>
      </div>

      <div class="pricing-card popular animate-on-scroll">
        <span class="popular-badge">Más Popular</span>
        <div class="pricing-header">
          <div class="pricing-icon">📅</div>
          <h3 class="pricing-name">Pro</h3>
          <p class="pricing-desc">Para negocios en crecimiento</p>
        </div>
        <div class="pricing-price">
          <span class="pricing-amount">$599</span>
          <span class="pricing-period">MXN/mes</span>
        </div>
        <ul class="pricing-features">
          <li><i class="fas fa-check"></i> Todo de Básico</li>
          <li><i class="fas fa-check"></i> Agenda de citas completa</li>
          <li><i class="fas fa-check"></i> Dashboard profesional</li>
          <li><i class="fas fa-check"></i> Recordatorios automáticos</li>
          <li><i class="fas fa-check"></i> Google Calendar sync</li>
          <li><i class="fas fa-check"></i> Mensajes ilimitados</li>
          <li class="disabled"><i class="fas fa-times"></i> IA personalizada</li>
        </ul>
        <a href="/auth/register?plan=pro" class="btn btn-primary btn-block btn-large">Empezar Gratis</a>
      </div>

      <div class="pricing-card animate-on-scroll">
        <div class="pricing-header">
          <div class="pricing-icon">🧠</div>
          <h3 class="pricing-name">Ultra</h3>
          <p class="pricing-desc">El poder de la IA avanzada</p>
        </div>
        <div class="pricing-price">
          <span class="pricing-amount">$999</span>
          <span class="pricing-period">MXN/mes</span>
        </div>
        <ul class="pricing-features">
          <li><i class="fas fa-check"></i> Todo de Pro</li>
          <li><i class="fas fa-check"></i> IA personalizada Claude</li>
          <li><i class="fas fa-check"></i> Seguimiento post-servicio</li>
          <li><i class="fas fa-check"></i> Marketing automático</li>
          <li><i class="fas fa-check"></i> Análisis de imágenes</li>
          <li><i class="fas fa-check"></i> Alertas en tiempo real</li>
          <li><i class="fas fa-check"></i> Soporte prioritario</li>
        </ul>
        <a href="/auth/register?plan=ultra" class="btn btn-outline btn-block btn-large">Empezar</a>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section class="faq" id="faq">
    <div class="section-header">
      <span class="section-tag"><i class="fas fa-question-circle"></i> FAQ</span>
      <h2 class="section-title">Preguntas frecuentes</h2>
    </div>
    <div class="faq-grid">
      <div class="faq-item">
        <button class="faq-question">
          <h4>¿Necesito conocimientos técnicos?</h4>
          <i class="fas fa-chevron-down"></i>
        </button>
        <div class="faq-answer">
          <p>No, para nada. BotSaaS está diseñado para que cualquier persona pueda configurar su bot en minutos. No necesitas saber programar ni tener experiencia técnica.</p>
        </div>
      </div>
      <div class="faq-item">
        <button class="faq-question">
          <h4>¿Puedo usar mi número de WhatsApp actual?</h4>
          <i class="fas fa-chevron-down"></i>
        </button>
        <div class="faq-answer">
          <p>Te recomendamos usar un número empresarial separado que nosotros te proporcionamos. Esto protege tu privacidad y garantiza cumplimiento con las políticas de Meta.</p>
        </div>
      </div>
      <div class="faq-item">
        <button class="faq-question">
          <h4>¿Qué pasa si un cliente necesita hablar con un humano?</h4>
          <i class="fas fa-chevron-down"></i>
        </button>
        <div class="faq-answer">
          <p>El bot detecta cuando una conversación requiere atención humana y te notifica inmediatamente. Puedes tomar el control de la conversación en cualquier momento.</p>
        </div>
      </div>
      <div class="faq-item">
        <button class="faq-question">
          <h4>¿Hay contrato de permanencia?</h4>
          <i class="fas fa-chevron-down"></i>
        </button>
        <div class="faq-answer">
          <p>No, puedes cancelar en cualquier momento. Sin penalizaciones, sin preguntas. Creemos que debes quedarte porque te aportamos valor, no por un contrato.</p>
        </div>
      </div>
      <div class="faq-item">
        <button class="faq-question">
          <h4>¿Cómo funciona la prueba gratuita?</h4>
          <i class="fas fa-chevron-down"></i>
        </button>
        <div class="faq-answer">
          <p>Tienes 14 días de acceso completo a todas las funciones sin costo. No pedimos tarjeta de crédito. Si te gusta, eliges un plan. Si no, simplemente no continúas.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="cta">
    <div class="cta-container animate-on-scroll">
      <div class="cta-badge">
        <i class="fas fa-gift"></i>
        14 días gratis, sin tarjeta
      </div>
      <h2>¿Listo para automatizar tu negocio?</h2>
      <p>Únete a +500 empresas que ya atienden clientes 24/7 sin esfuerzo. Configura tu bot en menos de 5 minutos.</p>
      <div class="cta-buttons">
        <a href="/auth/register" class="btn btn-primary btn-xl">
          Crear Mi Bot Gratis
          <i class="fas fa-arrow-right"></i>
        </a>
        <a href="#demo" class="btn btn-outline btn-large">
          <i class="fas fa-play"></i>
          Ver Demo en Vivo
        </a>
      </div>
      <div class="cta-trust">
        <div class="cta-trust-item">
          <i class="fas fa-check-circle"></i>
          Sin tarjeta de crédito
        </div>
        <div class="cta-trust-item">
          <i class="fas fa-check-circle"></i>
          Setup en 5 minutos
        </div>
        <div class="cta-trust-item">
          <i class="fas fa-check-circle"></i>
          Cancela cuando quieras
        </div>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="/" class="logo">
            <div class="logo-icon">🤖</div>
            Bot<span>SaaS</span>
          </a>
          <p>Automatiza la atención al cliente de tu negocio con bots inteligentes de WhatsApp. Sin código, sin complicaciones.</p>
          <div class="footer-badges">
            <div class="footer-badge">
              <i class="fas fa-shield-alt"></i>
              Meta Partner
            </div>
            <div class="footer-badge">
              <i class="fas fa-lock"></i>
              SSL Seguro
            </div>
          </div>
        </div>
        <div class="footer-links">
          <h4>Producto</h4>
          <ul>
            <li><a href="#features">Características</a></li>
            <li><a href="#pricing">Precios</a></li>
            <li><a href="#industries">Industrias</a></li>
            <li><a href="#testimonials">Casos de Éxito</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>Recursos</h4>
          <ul>
            <li><a href="/docs">Documentación</a></li>
            <li><a href="/blog">Blog</a></li>
            <li><a href="/api">API</a></li>
            <li><a href="/status">Status</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>Empresa</h4>
          <ul>
            <li><a href="/about">Nosotros</a></li>
            <li><a href="/contact">Contacto</a></li>
            <li><a href="/careers">Trabaja con nosotros</a></li>
            <li><a href="/partners">Partners</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>Legal</h4>
          <ul>
            <li><a href="/privacy">Privacidad</a></li>
            <li><a href="/terms">Términos</a></li>
            <li><a href="/cookies">Cookies</a></li>
            <li><a href="/gdpr">GDPR</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 BotSaaS. Todos los derechos reservados.</p>
        <div class="social-links">
          <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
          <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
          <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
          <a href="#" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
          <a href="#" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
        </div>
      </div>
    </div>
  </footer>

  <script>
    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    // Animate on scroll
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });

    // ROI Calculator
    const roiCitas = document.getElementById('roiCitas');
    const roiPrecio = document.getElementById('roiPrecio');
    const roiCitasSlider = document.getElementById('roiCitasSlider');
    const roiPrecioSlider = document.getElementById('roiPrecioSlider');
    const roiResult = document.getElementById('roiResult');

    function calculateROI() {
      const citas = parseInt(roiCitas.value) || 100;
      const precio = parseInt(roiPrecio.value) || 500;

      // Cálculo: 25% más citas + 20% menos faltas = ahorro estimado
      const citasRecuperadas = Math.round(citas * 0.20); // 20% faltas evitadas
      const citasNuevas = Math.round(citas * 0.15); // 15% más citas por disponibilidad 24/7
      const ahorro = (citasRecuperadas + citasNuevas) * precio;

      roiResult.textContent = '$' + ahorro.toLocaleString('es-MX');
    }

    roiCitas.addEventListener('input', () => {
      roiCitasSlider.value = roiCitas.value;
      calculateROI();
    });

    roiPrecio.addEventListener('input', () => {
      roiPrecioSlider.value = roiPrecio.value;
      calculateROI();
    });

    roiCitasSlider.addEventListener('input', () => {
      roiCitas.value = roiCitasSlider.value;
      calculateROI();
    });

    roiPrecioSlider.addEventListener('input', () => {
      roiPrecio.value = roiPrecioSlider.value;
      calculateROI();
    });

    // FAQ Accordion
    document.querySelectorAll('.faq-question').forEach(button => {
      button.addEventListener('click', () => {
        const item = button.parentElement;
        const isActive = item.classList.contains('active');

        // Close all
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));

        // Toggle current
        if (!isActive) {
          item.classList.add('active');
        }
      });
    });

    // Mobile menu (basic toggle)
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
      });
    }
  </script>

</body>
</html>
  `);
});

module.exports = router;
