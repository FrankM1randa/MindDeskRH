//npm install axios
//npm install cors
const axios = require('axios');

// AGORA APONTA PARA O ORQUESTRADOR (Porta 8050)
const ORQUESTRADOR_URL = "http://host.docker.internal:8050/api/v1/orchestrate";

exports.askAI = async (messageData) => {
    try {
        const response = await axios.post(ORQUESTRADOR_URL, {
            query: messageData.query,
            tenant_id: messageData.tenant_id,
            
            // Dados do usuário (Para o orquestrador saber quem é)
            user_id: messageData.user_id,
            role: messageData.role,
            current_agent: messageData.current_agent,

            // Chaves secretas que vão trafegar "escondidas"
            openai_api_key: process.env.OPENAI_API_KEY,
            supabase_url: process.env.SUPABASE_URL,
            supabase_key: process.env.SUPABASE_SERVICE_KEY
        });

        return response.data;
    } catch (error) {
        // MUDE ESTA PARTE PARA VER O ERRO REAL
        console.error("====== ERRO COMPLETO DO AXIOS ======");
        if (error.response) {
            // O servidor (Python) respondeu com um erro (ex: 422, 500)
            console.error("Status:", error.response.status);
            console.error("Dados:", error.response.data);
        } else if (error.request) {
            // A requisição saiu, mas não teve resposta (O Python não ouviu)
            console.error("Nenhuma resposta do Python. Request:", error.request);
        } else {
            // Erro na hora de montar a requisição (ex: chave mal formatada no .env)
            console.error("Erro interno do Node:", error.message);
        }
        console.error("====================================");

        throw new Error("A IA está fora do ar ou o endereço está incorreto.");
    }
};