/**
 * src/mesh/LibrarySeeder.js
 * Autonomous Classical Library Seeder for WyreNet
 * Populates all corresponding Imam channels with 246+ authenticated classical EPUBs.
 * Zero domain reliance. Zero emojis.
 */

const ImamRaziLibrary = require('./ImamRaziLibrary');
const ImamGhazaliLibrary = require('./ImamGhazaliLibrary');
const ImamNawawiLibrary = require('./ImamNawawiLibrary');
const ImamRaghibLibrary = require('./ImamRaghibLibrary');
const ClassicalHeritageLibrary = require('./ClassicalHeritageLibrary');

function resolveChannelAlias(id) {
  if (!id) return 'chan-general';
  const map = {
    'general': 'chan-general',
    'protocol-dev': 'chan-protocol-dev',
    'announcements': 'chan-announcements',
    'announcements-nashr': 'chan-announcements',
    'aynengineai': 'chan-aynengineai',
    'imam-razi': 'chan-imam-razi',
    'tafsir-matalib': 'chan-razi-tafsir-matalib',
    'kalam-usul': 'chan-razi-kalam-usul',
    'imam-abuhamid': 'chan-imam-abuhamidd',
    'kalam-falsafa': 'chan-ghazali-kalam-falsafa',
    'usul-mantiq': 'chan-ghazali-usul-mantiq',
    'suluk-adab': 'chan-ghazali-suluk-adab',
    'ihya-ulum-al-din': 'chan-ghazali-ihya',
    'imam-nawawi': 'chan-imam-nawawi',
    'hadith-fiqh': 'chan-nawawi-hadith-fiqh',
    'imam-raghib-al-isfahani': 'chan-imam-raghib',
    'lexicon-tafsir': 'chan-raghib-lexicon-tafsir',
    'akhlaq-adab': 'chan-raghib-akhlaq-adab',
    'classical-heritage': 'chan-classical-heritage',
    'voice-lounge': 'chan-voice-lounge',
    'voice-lounge-sawt': 'chan-voice-lounge',
    'asrar-rashid': 'chan-asrar-rashid',
    'shaykh-asrar-rashid': 'chan-asrar-rashid',
    'hamza-yusuf': 'chan-hamza-yusuf',
    'shaykh-hamza-yusuf': 'chan-hamza-yusuf'
  };
  return map[id] || id;
}

function seedAllLibraries(gossipMesh, spaceId = 'space-public-mesh') {
  const senderId = 'ibn-manzur@lisan';

  // ==========================================
  // 1. IMAM FAKHR AL-DIN AL-RAZI (544-606 AH)
  // ==========================================
  const raziCat = ImamRaziLibrary.getCatalog();
  
  // Main Channel: chan-imam-razi
  gossipMesh.clearChannelHistory('chan-imam-razi');
  gossipMesh.publish(spaceId, 'chan-imam-razi', {
    content: `**Sovereign Library of Imam Fakhr al-Din al-Razi (544-606 AH / 1149-1209 CE)**\n\nWelcome to the sovereign digital library of Imam Fakhr al-Din al-Razi. All masterworks have been translated with AynEngine AI classical vocabulary and anchored onto the sovereign mesh.\n\nSub-channels under this library:\n• **#tafsir-matalib**: Complete 32-in-1 Unified *Tafsir al-Kabir* & Complete 9 Volumes of *Al-Matalib al-'Aliyyah*.\n• **#kalam-usul**: Classical Kalam, Usul al-Fiqh & Heresiography Treatises (*Asas al-Taqdis*, *Lawami' al-Bayyinat*, *Kitab al-Arba'in*, *Al-Mahsul*, etc.).`
  }, { senderId });

  // Subchannel: chan-razi-tafsir-matalib
  gossipMesh.clearChannelHistory('chan-razi-tafsir-matalib');
  if (raziCat.tafsirKabirUnified && raziCat.tafsirKabirUnified.length > 0) {
    const atts = raziCat.tafsirKabirUnified.map(i => ({
      name: i.filename,
      type: 'application/epub+zip',
      size: i.filename.includes('bilingual') ? 32000000 : 16000000,
      data: i.downloadUrl,
      title: i.title,
      arabicTitle: i.arabicTitle
    }));
    gossipMesh.publish(spaceId, 'chan-razi-tafsir-matalib', {
      content: `**Tafsir al-Kabir (Mafatih al-Ghayb) - Sovereign 32-in-1 Masterwork Editions**\n*The monumental commentary on the Holy Quran by Imam Fakhr al-Din al-Razi, translated with AynEngine AI classical vocabulary. Complete unified 32-in-1 editions in Pure Scholarly English and Bilingual Quad-Lexical Apparatus.*`,
      attachments: atts
    }, { senderId });
  }

  if (raziCat.matalib && raziCat.matalib.length > 0) {
    const atts = raziCat.matalib.map(i => ({
      name: i.filename,
      type: 'application/epub+zip',
      size: 1200000,
      data: i.downloadUrl,
      title: i.title,
      arabicTitle: i.arabicTitle
    }));
    gossipMesh.publish(spaceId, 'chan-razi-tafsir-matalib', {
      content: `**Al-Matalib al-'Aliyyah min al-'Ilm al-Ilahi - Volumes 1 to 9 (Official Editions)**\n*The supreme metaphysical and philosophical opus of Imam al-Razi, spanning Cosmology, Divine Attributes, Subatomic Physics, The Rational Soul, and Eschatology (Pure English & Bilingual editions).*`,
      attachments: atts
    }, { senderId });
  }

  // Subchannel: chan-razi-kalam-usul
  gossipMesh.clearChannelHistory('chan-razi-kalam-usul');
  if (raziCat.kalamTreatises && raziCat.kalamTreatises.length > 0) {
    const atts = raziCat.kalamTreatises.map(i => ({
      name: i.filename,
      type: 'application/epub+zip',
      size: 900000,
      data: i.downloadUrl,
      title: i.title,
      arabicTitle: i.arabicTitle
    }));
    gossipMesh.publish(spaceId, 'chan-razi-kalam-usul', {
      content: `**Classical Kalam, Usul al-Fiqh & Heresiography Masterworks**\n*Definitive translations of Asas al-Taqdis, Lawami' al-Bayyinat, Kitab al-Arba'in, Al-Mahsul fi 'Ilm Usul al-Fiqh, Asrar al-Tanzil, 'Ismat al-Anbiya', I'tiqadat Firaq al-Muslimin, Al-Qada' wa'l-Qadar, and Jami' al-Tafsir.*`,
      attachments: atts
    }, { senderId });
  }

  // ====================================================
  // 2. HUJJAT AL-ISLAM IMAM ABU HAMID AL-GHAZALI (450-505 AH)
  // ====================================================
  const ghazaliCat = ImamGhazaliLibrary.getCatalog();

  // Main Channel: chan-imam-abuhamidd
  gossipMesh.clearChannelHistory('chan-imam-abuhamidd');
  gossipMesh.publish(spaceId, 'chan-imam-abuhamidd', {
    content: `**Sovereign Library of Hujjat al-Islam Imam Abu Hamid al-Ghazali (450-505 AH / 1058-1111 CE)**\n\nWelcome to the sovereign digital library of Imam Abu Hamid al-Ghazali. Click into sub-channels to access official translated editions:\n• **#ihya-ulum-al-din**: Ihya 'Ulum al-Din Complete 40 Books (Single Omnibus & 4 Quarters).\n• **#kalam-falsafa**: Kalam, Philosophical Critiques & Polemics (*Tahafut al-Falasifa*, *Al-Iqtisad*, *Maqasid*, *Qawa'id*, *Fada'ih*).\n• **#usul-mantiq**: Legal Theory & Classical Logic (*Al-Mustasfa*, *Al-Mankhul*, *Shifa al-Ghalil*, *Mi'yar al-'Ilm*, *Mihakk al-Nazar*).\n• **#suluk-adab**: Spiritual Path, Ethics & Divine Wisdom (*Al-Munqidh*, *Mishkat al-Anwar*, *Bidayat al-Hidayah*, *Minhaj*, *Mizan*, etc.).`
  }, { senderId });

  // Subchannel: chan-ghazali-ihya
  gossipMesh.clearChannelHistory('chan-ghazali-ihya');
  const ihyaAtts = [
    {
      name: 'ihya_ulum_al_din_pure_en.epub',
      type: 'application/epub+zip',
      size: 5800000,
      data: '/epubs/ihya_ulum_al_din_pure_en.epub',
      title: "Ihya 'Ulum al-Din (Complete 40 Books — Pure Scholarly English)",
      arabicTitle: "إِحْيَاء عُلُوم الدِّين (الأَرْبَعُونَ كِتَاباً كَامِلَة)"
    },
    {
      name: 'ihya_ulum_al_din_bilingual_lexical_en.epub',
      type: 'application/epub+zip',
      size: 11200000,
      data: '/epubs/ihya_ulum_al_din_bilingual_lexical_en.epub',
      title: "Ihya 'Ulum al-Din (Complete 40 Books — Bilingual Lexical Apparatus)",
      arabicTitle: "إِحْيَاء عُلُوم الدِّين (النُّسْخَة المُزْدَوِجَة مُعْجَمِيَّة)"
    },
    {
      name: 'ihya_ulum_al_din_vol_01_ibadat_en.epub',
      type: 'application/epub+zip',
      size: 1600000,
      data: '/epubs/ihya_ulum_al_din_vol_01_ibadat_en.epub',
      title: "Ihya 'Ulum al-Din — Vol 1: Quarter of Worship (Rub' al-'Ibadat)",
      arabicTitle: "رُبْع العِبَادَات (الكُتُب ١ - ١٠)"
    },
    {
      name: 'ihya_ulum_al_din_vol_02_adat_en.epub',
      type: 'application/epub+zip',
      size: 1550000,
      data: '/epubs/ihya_ulum_al_din_vol_02_adat_en.epub',
      title: "Ihya 'Ulum al-Din — Vol 2: Quarter of Daily Habits (Rub' al-'Adat)",
      arabicTitle: "رُبْع العَادَات (الكُتُب ١١ - ٢٠)"
    },
    {
      name: 'ihya_ulum_al_din_vol_03_muhlikat_en.epub',
      type: 'application/epub+zip',
      size: 1500000,
      data: '/epubs/ihya_ulum_al_din_vol_03_muhlikat_en.epub',
      title: "Ihya 'Ulum al-Din — Vol 3: Quarter of Destructive Vices (Rub' al-Muhlikat)",
      arabicTitle: "رُبْع المَهْلِكَات (الكُتُب ٢١ - ٣٠)"
    },
    {
      name: 'ihya_ulum_al_din_vol_04_munjiyat_en.epub',
      type: 'application/epub+zip',
      size: 1650000,
      data: '/epubs/ihya_ulum_al_din_vol_04_munjiyat_en.epub',
      title: "Ihya 'Ulum al-Din — Vol 4: Quarter of Saving Virtues (Rub' al-Munjiyat)",
      arabicTitle: "رُبْع المُنْجِيَات (الكُتُب ٣١ - ٤٠)"
    }
  ];
  gossipMesh.publish(spaceId, 'chan-ghazali-ihya', {
    content: `**Ihya 'Ulum al-Din Complete 40 Books Masterwork (إِحْيَاء عُلُوم الدِّين)**\n*The complete single-corpus translation and four quarter volumes of the Revival of the Religious Sciences by Hujjat al-Islam Imam Abu Hamid al-Ghazali. Translated with AynEngine AI Sovereign Morphological Edition.*`,
    attachments: ihyaAtts
  }, { senderId });

  // Subchannel: chan-ghazali-kalam-falsafa
  gossipMesh.clearChannelHistory('chan-ghazali-kalam-falsafa');
  if (ghazaliCat.kalamAndPhilosophy && ghazaliCat.kalamAndPhilosophy.length > 0) {
    const atts = ghazaliCat.kalamAndPhilosophy.map(i => ({
      name: i.filename,
      type: 'application/epub+zip',
      size: 600000,
      data: i.downloadUrl,
      title: i.title,
      arabicTitle: i.arabicTitle
    }));
    gossipMesh.publish(spaceId, 'chan-ghazali-kalam-falsafa', {
      content: `**Kalam, Philosophy & Polemics Masterworks**\n*Definitive authorial translations of Tahafut al-Falasifa, Al-Iqtisad fi al-I'tiqad, Maqasid al-Falasifah, Qawa'id al-'Aqa'id, Fada'ih al-Batiniyya, and Al-Radd al-Jamil.*`,
      attachments: atts
    }, { senderId });
  }

  // Subchannel: chan-ghazali-usul-mantiq
  gossipMesh.clearChannelHistory('chan-ghazali-usul-mantiq');
  if (ghazaliCat.usulAndLogic && ghazaliCat.usulAndLogic.length > 0) {
    const atts = ghazaliCat.usulAndLogic.map(i => ({
      name: i.filename,
      type: 'application/epub+zip',
      size: 700000,
      data: i.downloadUrl,
      title: i.title,
      arabicTitle: i.arabicTitle
    }));
    gossipMesh.publish(spaceId, 'chan-ghazali-usul-mantiq', {
      content: `**Legal Theory & Classical Logic Masterworks**\n*Definitive translations of Al-Mustasfa min 'Ilm al-Usul, Al-Mankhul, Shifa al-Ghalil, Mi'yar al-'Ilm, and Mihakk al-Nazar.*`,
      attachments: atts
    }, { senderId });
  }

  // Subchannel: chan-ghazali-suluk-adab
  gossipMesh.clearChannelHistory('chan-ghazali-suluk-adab');
  if (ghazaliCat.sulukAndEthics && ghazaliCat.sulukAndEthics.length > 0) {
    const atts = ghazaliCat.sulukAndEthics.filter(i => i.slug !== 'ihya_ulum_al_din').map(i => ({
      name: i.filename,
      type: 'application/epub+zip',
      size: 600000,
      data: i.downloadUrl,
      title: i.title,
      arabicTitle: i.arabicTitle
    }));
    gossipMesh.publish(spaceId, 'chan-ghazali-suluk-adab', {
      content: `**Spiritual Path, Ethics & Divine Wisdom Masterworks**\n*Unabridged translations of Al-Munqidh min al-Dalal, Mishkat al-Anwar, Bidayat al-Hidayah, Minhaj al-'Abidin, Mizan al-'Amal, Al-Maqsad al-Asna, Jawahir al-Quran, Ma'arij al-Quds, Asnaf al-Maghrurin, Sirr al-'Alamin, Kimiya-yi Sa'adat, and Al-Wasit.*`,
      attachments: atts
    }, { senderId });
  }

  // ====================================================
  // 3. IMAM YAHYA IBN SHARAF AL-NAWAWI (631-676 AH)
  // ====================================================
  const nawawiCat = ImamNawawiLibrary.getCatalog();
  
  // Main Channel: chan-imam-nawawi
  gossipMesh.clearChannelHistory('chan-imam-nawawi');
  gossipMesh.publish(spaceId, 'chan-imam-nawawi', {
    content: `**Library of Imam Yahya ibn Sharaf al-Nawawi (631-676 AH / 1233-1277 CE)**\n\nWelcome to the sovereign digital library of Imam al-Nawawi. Official translations across Hadith, Adhkar, and Sacred Fiqh are accessible in **#hadith-fiqh**.`
  }, { senderId });

  // Subchannel: chan-nawawi-hadith-fiqh
  gossipMesh.clearChannelHistory('chan-nawawi-hadith-fiqh');
  const nawawiItems = [
    ...(nawawiCat.pureEditions || []),
    ...(nawawiCat.bilingualEditions || []),
    ...(nawawiCat.legacyArchive || [])
  ];
  if (nawawiItems.length > 0) {
    const atts = nawawiItems.map(i => ({
      name: i.filename,
      type: 'application/epub+zip',
      size: 800000,
      data: i.downloadUrl,
      title: i.title,
      arabicTitle: i.arabicTitle
    }));
    gossipMesh.publish(spaceId, 'chan-nawawi-hadith-fiqh', {
      content: `**Hadith, Adhkar & Sacred Fiqh Masterworks**\n*Definitive translations of Riyad al-Salihin, Sharh Sahih Muslim (Vols 1-5), Kitab al-Adhkar, Al-Tibyan fi Adab Hamalat al-Quran, Al-Arba'in al-Nawawiyyah, Minhaj al-Talibin, Rawdat al-Talibin (Vols 1-4), Adab al-Fatwa, and Al-Idah fi Manasik al-Hajj.*`,
      attachments: atts
    }, { senderId });
  }

  // ====================================================
  // 4. IMAM AL-RAGHIB AL-ISFAHANI (d. 502 AH)
  // ====================================================
  const raghibCat = ImamRaghibLibrary.getCatalog();

  // Main Channel: chan-imam-raghib
  gossipMesh.clearChannelHistory('chan-imam-raghib');
  gossipMesh.publish(spaceId, 'chan-imam-raghib', {
    content: `**Library of Imam al-Raghib al-Isfahani (d. 502 AH / 1108 CE)**\n\nWelcome to the sovereign library of Imam al-Raghib al-Isfahani. Complete classical English and bilingual editions:\n• **#lexicon-tafsir**: Quranic Lexicography & Exegesis (*Al-Mufradat fi Gharib al-Quran*, *Jami' al-Tafsir*).\n• **#akhlaq-adab**: Ethical Philosophy & Adab (*Al-Dhari'ah*, *Tafsil al-Nash'atayn*, *Adab Ikhtilat al-Nas*, *Muhadarat al-Udaba*).`
  }, { senderId });

  // Subchannel: chan-raghib-lexicon-tafsir
  gossipMesh.clearChannelHistory('chan-raghib-lexicon-tafsir');
  const raghibLex = [
    ...(raghibCat.pureEditions || []).filter(i => i.slug === 'al_mufradat' || i.slug === 'jami_al_tafsir'),
    ...(raghibCat.bilingualEditions || []).filter(i => i.slug === 'al_mufradat' || i.slug === 'jami_al_tafsir')
  ];
  if (raghibLex.length > 0) {
    const atts = raghibLex.map(i => ({
      name: i.filename,
      type: 'application/epub+zip',
      size: 1400000,
      data: i.downloadUrl,
      title: i.title,
      arabicTitle: i.arabicTitle
    }));
    gossipMesh.publish(spaceId, 'chan-raghib-lexicon-tafsir', {
      content: `**Quranic Lexicography & Exegesis Masterworks**\n*Authorial translations of Al-Mufradat fi Gharib al-Quran and Jami' al-Tafsir.*`,
      attachments: atts
    }, { senderId });
  }

  // Subchannel: chan-raghib-akhlaq-adab
  gossipMesh.clearChannelHistory('chan-raghib-akhlaq-adab');
  const raghibEth = [
    ...(raghibCat.pureEditions || []).filter(i => i.slug !== 'al_mufradat' && i.slug !== 'jami_al_tafsir'),
    ...(raghibCat.bilingualEditions || []).filter(i => i.slug !== 'al_mufradat' && i.slug !== 'jami_al_tafsir')
  ];
  if (raghibEth.length > 0) {
    const atts = raghibEth.map(i => ({
      name: i.filename,
      type: 'application/epub+zip',
      size: 750000,
      data: i.downloadUrl,
      title: i.title,
      arabicTitle: i.arabicTitle
    }));
    gossipMesh.publish(spaceId, 'chan-raghib-akhlaq-adab', {
      content: `**Ethical Philosophy & Adab Masterworks**\n*Definitive translations of Al-Dhari'ah ila Makarim al-Shari'ah, Tafsil al-Nash'atayn, Adab Ikhtilat al-Nas, and Muhadarat al-Udaba (Vols 1-2).*`,
      attachments: atts
    }, { senderId });
  }

  // ====================================================
  // 5. CLASSICAL ISLAMIC HERITAGE & IRFAN
  // ====================================================
  const heritageCat = ClassicalHeritageLibrary.getCatalog();
  gossipMesh.clearChannelHistory('chan-classical-heritage');
  const heritageItems = [
    ...(heritageCat.shamailAndSira || []),
    ...(heritageCat.irfanAndMetaphysics || []),
    ...(heritageCat.spiritualConduct || []),
    ...(heritageCat.classicalTreasures || [])
  ];
  if (heritageItems.length > 0) {
    const atts = heritageItems.map(i => ({
      name: i.filename,
      type: 'application/epub+zip',
      size: 900000,
      data: i.downloadUrl,
      title: i.title,
      arabicTitle: i.arabicTitle
    }));
    gossipMesh.publish(spaceId, 'chan-classical-heritage', {
      content: `**Classical Islamic Heritage, 'Irfan & Shama'il Library**\n*Featuring Kitab al-Shifa (Qadi 'Iyad, Vols 1-2), Al-Futuhat al-Makkiyya (Ibn 'Arabi), Sunan al-Muhtadin (Al-Mawwaq), and Al-Burdah al-Sharifah.*`,
      attachments: atts
    }, { senderId });
  }

  // ====================================================
  // 6. AYNENGINE AI ARCHITECTURE & CODE
  // ====================================================
  gossipMesh.clearChannelHistory('chan-aynengineai');
  gossipMesh.publish(spaceId, 'chan-aynengineai', {
    content: `**AynEngine AI // Sovereign Classical Translation & Coding Engine**\n\nWelcome to **#aynengineai** — the official architecture showcase and release tracking channel for AynEngine AI.\n\n**Foundational 5-Pillar Classical Architecture:**\n1. **Kitab al-Ayn** (al-Khalil ibn Ahmad al-Farahidi, d. 175 AH) — Phonetic permutation matrix and radical consonant mapping.\n2. **Al-Mufradat fi Gharib al-Quran** (al-Raghib al-Isfahani, d. 502 AH) — Quranic semantic nuance and metaphysical distinctions.\n3. **Asas al-Balaghah** (al-Zamakhshari, d. 538 AH) — Rhetorical balance, metaphoric extension (majaz), and literal (haqiqah) boundaries.\n4. **Lisan al-Arab** (Ibn Manzur, d. 711 AH) — Comprehensive classical lexicographical canon comprising 346,000+ entries.\n5. **Al-Kitab** (Sibawayh, d. 180 AH) — Classical syntactic scaffolding, grammatical relations, and inflectional governance.`
  }, { senderId });

  // ====================================================
  // 7. CONTEMPORARY CLASSICAL SCHOLARS
  // ====================================================
  gossipMesh.clearChannelHistory('chan-asrar-rashid');
  gossipMesh.publish(spaceId, 'chan-asrar-rashid', {
    content: `**Shaykh Asrar Rashid — Theologian, Faqih, Logician (Ahl al-Sunnah)**\n*Discourses on Classical Kalam, Logic (Mantiq), Hanafi Fiqh, and contemporary philosophical responses to modernism.*`
  }, { senderId: 'asrar-bot@mesh' });

  gossipMesh.clearChannelHistory('chan-hamza-yusuf');
  gossipMesh.publish(spaceId, 'chan-hamza-yusuf', {
    content: `**Shaykh Hamza Yusuf — Classical Humanities, Logic & Zaytuna Curriculum**\n*Treatises on Purification of the Heart, Matn Ibn 'Ashir, Classical Arabic Rhetoric, and Trivium/Quadrivium integration.*`
  }, { senderId: 'hamza-bot@mesh' });

  console.log('[LibrarySeeder] Successfully seeded all classical Imam channels with 246+ EPUBs.');
}

module.exports = {
  seedAllLibraries,
  resolveChannelAlias
};
