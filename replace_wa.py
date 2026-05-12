import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace WhatsAppIcon SVG
old_svg = """const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.393 0 12.029c0 2.125.547 4.197 1.591 6.042L0 24l6.135-1.61a11.75 11.75 0 005.911 1.603h.005c6.634 0 12.032-5.396 12.034-12.03a11.75 11.75 0 00-3.489-8.487" />
  </svg>
)"""

new_svg = """const TelegramIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.686c.223-.198-.054-.31-.35-.11l-6.4 4.024-2.76-.86c-.6-.188-.61-.6.125-.89l10.85-4.18c.5-.188.945.11.765.945z" />
  </svg>
)"""

content = content.replace(old_svg, new_svg)

# Replace occurrences of WhatsAppIcon with TelegramIcon
content = content.replace('WhatsAppIcon', 'TelegramIcon')

# Replace WA links
content = content.replace('http://wa.me/+639608293886', 'https://t.me/cardingucsupport')

# Replace text
content = content.replace('WhatsApp Support', 'Telegram Support')
content = content.replace('WhatsApp <span', 'Telegram <span')
content = content.replace('Floating WhatsApp Button', 'Floating Telegram Button')

# Replace colors in specific buttons
# Desktop nav button
content = content.replace('border-green-500/50 text-green-600 hover:bg-green-500/10', 'border-sky-500/50 text-sky-600 hover:bg-sky-500/10')

# Mobile nav button
content = content.replace('text-green-500 bg-green-500/10 hover:bg-green-500/15 active:bg-green-500/20', 'text-sky-500 bg-sky-500/10 hover:bg-sky-500/15 active:bg-sky-500/20')

# Support section button
content = content.replace('shadow-green-500/20 bg-green-600 hover:bg-green-700', 'shadow-sky-500/20 bg-sky-600 hover:bg-sky-700')

# Floating button
content = content.replace('bg-[#25D366] rounded-full flex items-center justify-center shadow-xl shadow-green-500/30 border border-white/20 hover:bg-[#20ba5a]', 'bg-[#0088cc] rounded-full flex items-center justify-center shadow-xl shadow-sky-500/30 border border-white/20 hover:bg-[#0077b5]')

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
