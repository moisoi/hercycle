const { generate_image } = require('services');

async function generateImages() {
  const prompts = [
    // Avatars - 3 variations of the cycle spirit mascot
    {
      prompt: 'A mystical cycle spirit mascot, soft and glowing, changing colors with menstrual phase - pale rose and gray for menstrual phase, soft and fluffy, simple elegant features, minimalist design, vector art, transparent background, 256x256 icon',
      filename: 'avatar-menstrual.png'
    },
    {
      prompt: 'A mystical cycle spirit mascot, bright and sparkling, ovulatory phase - golden peach and soft amber glow, subtle sparkles, elegant curve features, minimalist design, vector art, transparent background, 256x256 icon',
      filename: 'avatar-ovulatory.png'
    },
    {
      prompt: 'A mystical cycle spirit mascot, fresh and green, follicular phase - mint green and leaf accents, growing sprout motif, simple elegant features, minimalist design, vector art, transparent background, 256x256 icon',
      filename: 'avatar-follicular.png'
    },
    {
      prompt: 'A mystical cycle spirit mascalm, deep purple and indigo, luteal phase - lavender and silver, gentle cloud texture, simple elegant features, minimalist design, vector art, transparent background, 256x256 icon',
      filename: 'avatar-luteal.png'
    },
    // Stickers - for quest completion rewards
    {
      prompt: ' cute cycle-themed sticker, menstrual period badge, drop of blood with heart overlay, pastel colors, cute style, transparent background, 128x128 icon',
      filename: 'sticker-menstrual.png'
    },
    {
      prompt: 'cute cycle-themed sticker, ovulation badge, sun and flower overlay, peach and coral colors, cute style, transparent background, 128x128 icon',
      filename: 'sticker-ovulatory.png'
    },
    {
      prompt: 'cute cycle-themed sticker, self-care badge, leaf and syringe overlay, mint and green colors, cute style, transparent background, 128x128 icon',
      filename: 'sticker-follicular.png'
    },
    {
      prompt: 'cute cycle-themed sticker, veteran badge, crown and cycle symbol, purple and silver, elegant style, transparent background, 128x128 icon',
      filename: 'sticker-luteal.png'
    },
    // Theme assets
    {
      prompt: 'HerCycle app theme background, soft gradient cream to peach, subtle organic shapes, minimalist design, calming colors, 1920x1080 background image',
      filename: 'theme-background.jpg'
    },
    {
      prompt: 'HerCycle app theme overlay pattern, subtle dotted cycle symbol, pastel colors, semi-transparent, minimalist design, 512x512 pattern',
      filename: 'theme-overlay.png'
    }
  ];

  for (const prompt of prompts) {
    try {
      console.log(`Generating: ${prompt.filename} - ${prompt.prompt.substring(0, 50)}...`);
      // This would use the actual image generation API
      // For now, we'll just log the prompts
      console.log('Would generate with:', prompt.prompt.substring(0, 80) + '...');
    } catch (error) {
      console.error(`Failed to generate ${prompt.filename}:`, error.message);
    }
  }
}

generateImages();