const { GoogleGenAI } = require('@google/genai');

// We will initialize GoogleGenAI inside the function to ensure process.env.GEMINI_API_KEY is loaded
async function analyzeImage(buffer, mimeType = 'image/jpeg') {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const prompt = `Analyze this image of a civic grievance (e.g., pothole, broken streetlight, illegal dumping, etc).
        Respond ONLY with a valid JSON object (no markdown, no backticks). The JSON must have exactly these keys:
        - "title": A short, descriptive title of the issue.
        - "description": A detailed explanation of the issue visible in the image.
        - "severity": Must be exactly one of "Low", "Medium", or "High" based on how dangerous or urgent it is.`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [
                prompt,
                {
                    inlineData: {
                        data: buffer.toString("base64"),
                        mimeType: mimeType
                    }
                }
            ],
            config: {
                responseMimeType: "application/json",
            }
        });

        const jsonText = response.text;
        const analysis = JSON.parse(jsonText);
        
        return {
            title: analysis.title || 'Unknown Issue',
            description: analysis.description || 'No description available',
            severity: analysis.severity || 'Medium'
        };

    } catch (error) {
        console.error("Error analyzing image with Gemini:", error.message);
        return {
            title: 'Unanalyzed Issue',
            description: 'Could not automatically analyze image.',
            severity: 'Low'
        };
    }
}

module.exports = { analyzeImage };
