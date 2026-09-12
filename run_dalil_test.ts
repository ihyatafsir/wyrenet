import { shabahStego } from './src/network/ShabahStego';
const cover = 'Just had the best coffee this morning! ☕ Nothing beats a fresh brew to start the day. #MondayMotivation';
const payload = JSON.stringify({ i: 'peer_xsascps7', k: 'abcdef1234567890abcdef12345678901', endpoints: [], nonce: '123' });
console.log('Payload len:', payload.length);
const result = shabahStego.hideInText(cover, payload);
const stegoText = result.stegoData as string;
console.log('Stego published len:', stegoText.length);
const ex = shabahStego.extractFromText(stegoText);
console.log('Extracted raw:', ex);
