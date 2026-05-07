//npm install axios
//npm install cors


const axios = require('axios');

// No Docker, para um container falar com o outro no mesmo PC, 
// usamos 'host.docker.internal' em vez de 'localhost' no Windows/Mac.
const AI_URL = "http://host.docker.internal:8000/api/v1/ask";

exports.askAI = async (messageData) => {
    try {
        const response = await axios.post(AI_URL, {
            query: messageData.query,
            tenant_id: messageData.tenant_id,
            openai_api_key: process.env.OPENAI_API_KEY,
            supabase_url: process.env.SUPABASE_URL,
            supabase_key: process.env.SUPABASE_SERVICE_KEY
        });

        return response.data;
    } catch (error) {
        console.error("Erro ao chamar o Microsserviço de IA:", error.message);
        throw new Error("A IA está fora do ar ou o endereço está incorreto.");
    }
};