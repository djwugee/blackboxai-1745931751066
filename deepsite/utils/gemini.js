export async function generateContent(prompt, previousPrompt = '', currentHtml = '') {
  try {
    const systemPrompt = `You are a web development expert. Create beautiful, responsive websites using HTML, CSS, and JavaScript.
        
Requirements:
- Use Tailwind CSS for styling (include <script src="https://cdn.tailwindcss.com"></script> in head)
- For icons, use Font Awesome (include <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">)
- Create modern, clean designs with appropriate spacing
- Ensure responsive layouts that work on all devices
- Add subtle animations where appropriate
- ALWAYS return a complete HTML file
- Include comments explaining key sections`;

    const contents = [{
      role: "user",
      parts: [{ text: systemPrompt }]
    }];
    
    if (previousPrompt) {
      contents.push({
        role: "user",
        parts: [{ text: `Previous request: ${previousPrompt}` }]
      });
    }
    
    if (currentHtml) {
      contents.push({
        role: "user",
        parts: [{ text: `Current HTML: ${currentHtml}` }]
      });
    }
    
    contents.push({
      role: "user",
      parts: [{ text: prompt }]
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}\n${JSON.stringify(errorData, null, 2)}`);
    }

    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text;
    
    // Extract HTML if the response contains markdown code blocks
    if (text.includes('```html')) {
      text = text.split('```html')[1].split('```')[0].trim();
    }
    
    // Ensure the response is a complete HTML document
    if (!text.includes('<!DOCTYPE html>')) {
      text = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <title>Generated Page</title>
</head>
<body>
${text}
</body>
</html>`;
    }
    
    return text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}
