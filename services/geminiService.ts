
import { GoogleGenAI } from "@google/genai";
import { Product } from "../types";

export const getAIPricingAdvice = async (product: Partial<Product>) => {
  // Creating a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise este produto para sugestão de preço estratégica: 
      Nome: ${product.name}
      Categoria: ${product.category}
      Preço de Custo: R$ ${product.costPrice}
      Margem Atual: ${product.margin}%
      
      Forneça uma justificativa curta (máximo 2 frases) para manter ou alterar o preço de venda baseado em competitividade e margem saudável.`,
    });

    // Directly access the text property as per guidelines (it's a getter, not a method)
    return response.text || "Sem sugestões automáticas no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao conectar com a IA de preços.";
  }
};
