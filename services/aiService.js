cat > services/aiService.js << 'ENDOFFILE'
// services/aiService.js
const Anthropic = require('@anthropic-ai/sdk');

class AIService {
  constructor() {
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'DISABLED') {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      this.enabled = true;
    } else {
      this.enabled = false;
      console.log('⚠️ IA Deshabilitada - Configura ANTHROPIC_API_KEY para activar');
    }
  }

  isEnabled() {
    return this.enabled;
  }

  getIndustryPrompt(business) {
    const services = business.services.map(s => `- ${s.name}: $${s.price} MXN`).join('\n');
    
    return `Eres el asistente de ${business.businessName}.

REGLAS:
1. SOLO hablas de servicios de ${business.businessType} y citas
2. Si preguntan otra cosa, redirige amablemente
3. Sé breve (máximo 3 líneas)

SERVICIOS:
${services}

CONTACTO: ${business.whatsappBusiness}

Ayuda a agendar citas y responde sobre servicios.`;
  }

  async processMessage(business, conversationHistory, newMessage) {
    if (!this.isEnabled()) {
      return {
        success: false,
        error: 'IA no disponible',
        fallback: true
      };
    }

    try {
      const systemPrompt = this.getIndustryPrompt(business);
      
      const messages = [
        ...conversationHistory,
        { role: 'user', content: newMessage }
      ];

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        system: systemPrompt,
        messages: messages,
        temperature: 0.7
      });

      return {
        success: true,
        response: response.content[0].text,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens
        }
      };

    } catch (error) {
      console.error('Error AI:', error);
      return {
        success: false,
        response: `Hola! Soy el asistente de ${business.businessName}. ¿En qué puedo ayudarte?`,
        error: error.message,
        fallback: true
      };
    }
  }

  calculateCost(usage) {
    const INPUT_COST = 3 / 1000000;
    const OUTPUT_COST = 15 / 1000000;
    const total = (usage.inputTokens * INPUT_COST) + (usage.outputTokens * OUTPUT_COST);
    return {
      totalCost: total,
      totalCostMXN: total * 20
    };
  }
}

module.exports = new AIService();
ENDOFFILE
