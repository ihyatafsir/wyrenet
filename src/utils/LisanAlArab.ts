/**
 * مُعْجَم التَّشْخِيص (Mu'jam al-Tashkhis) - Diagnostic Dictionary
 * From Lisan al-Arab: "مُعْجَم - dictionary, lexicon" | "تَشْخِيص - diagnosis"
 * 
 * Maps technical events to beautiful Arabic terminology
 * Provides clear, precise language for debugging
 */

// Core protocol diagnostics
export const LISAN_DIAGNOSTICS = {
    // Connection states (حَالَة الوَصْل)
    WASL_MUTTASIL: { ar: 'وَصْل مُتَّصِل', meaning: 'Connection established successfully' },
    WASL_MUNFASIL: { ar: 'وَصْل مُنْفَصِل', meaning: 'Connection terminated/dropped' },
    WASL_YATTASIL: { ar: 'وَصْل يَتَّصِل', meaning: 'Connection in progress' },
    WASL_MUQTA: { ar: 'وَصْل مُقْطَع', meaning: 'Connection severed/error state' },

    // Discovery events (اِكْتِشَاف)
    WASAM_NASHR: { ar: 'وَسْم نَشْر', meaning: 'Publishing presence to registry' },
    WASAM_TAFATTUSH: { ar: 'وَسْم تَفَتُّش', meaning: 'Searching registry for peers' },
    WASAM_LIQA: { ar: 'وَسْم لِقَاء', meaning: 'Peer meeting successful' },

    // Encryption events (تَشْفِير)
    MIFTAH_TASIS: { ar: 'مِفْتَاح تَأْسِيس', meaning: 'Key establishment initiated' },
    MIFTAH_TASHFIR: { ar: 'مِفْتَاح تَشْفِير', meaning: 'Message encrypted' },
    MIFTAH_FAKK: { ar: 'مِفْتَاح فَكّ', meaning: 'Message decrypted' },
    MIFTAH_MAFTUH: { ar: 'مِفْتَاح مَفْتُوح', meaning: 'Key opened successfully' },

    // Security events (أَمَان)
    THAQB_SAHIH: { ar: 'ثَقْب صَحِيح', meaning: 'NAT puncture successful' },
    THAQB_FAIL: { ar: 'ثَقْب فَشَل', meaning: 'NAT puncture failed' },
    THAQB_REPLAY: { ar: 'ثَقْب إِعَادَة', meaning: 'Replay attack detected/blocked' },

    // Relay events (وَسِيط)
    MUDTADEEF_BAD: { ar: 'مُسْتَضِيف بَدْء', meaning: 'Host mode started' },
    MUDTADEEF_WAQF: { ar: 'مُسْتَضِيف وَقْف', meaning: 'Host mode stopped' },
    MUTTASIL_ITTISAL: { ar: 'مُتَّصِل اِتِّصَال', meaning: 'Client connected to host' },

    // Message events (رِسَالَة)
    RISALA_IRSAL: { ar: 'رِسَالَة إِرْسَال', meaning: 'Message sent' },
    RISALA_ISTIQBAL: { ar: 'رِسَالَة اِسْتِقْبَال', meaning: 'Message received' },
    RISALA_TASLIM: { ar: 'رِسَالَة تَسْلِيم', meaning: 'Message delivered' },
    RISALA_FAIL: { ar: 'رِسَالَة فَشَل', meaning: 'Message failed' },

    // Heartbeat events (نَبْض)
    NABD_SAHIH: { ar: 'نَبْض صَحِيح', meaning: 'Heartbeat OK' },
    NABD_MAFQUD: { ar: 'نَبْض مَفْقُود', meaning: 'Heartbeat lost' },

    // Queue events (طَابُور)
    TABUR_IDAFA: { ar: 'طَابُور إِضَافَة', meaning: 'Added to queue' },
    TABUR_IADA: { ar: 'طَابُور إِعَادَة', meaning: 'Retry from queue' },

    
    // Classical Lexica & Advanced Crypto (الأَصَالَة اللُّغَوِيَّة والتَّعْمِيَة)
    SIBAWAYH_IBDAL: { ar: 'سِيبَوَيْه إِبْدَال', meaning: 'Acoustic S-Box non-linear permutation' },
    SIBAWAYH_IDGHAM: { ar: 'سِيبَوَيْه إِدْغَام', meaning: 'Circular state diffusion mixing' },
    ALKHALIL_TAQLIB: { ar: 'الخَلِيل تَقَالِيب', meaning: 'Combinatorial keyspace derivation' },
    ALKHALIL_RATCHET: { ar: 'الخَلِيل رَاتْشِيت', meaning: 'Halq-to-Lips forward secrecy ratchet step' },
    MAQAYIS_ASL: { ar: 'مَقَايِيس أَصْل', meaning: 'Semantic root invariant distilled' },
    DURAYHIM_TAMWIH: { ar: 'الدُّرَيْهِم تَمْوِيه', meaning: 'Dynamic DPI obfuscation nulls injected' },
    NAGHAM_FEC_OK: { ar: 'نَغَم تَصْحِيح', meaning: 'DTMF Reed-Solomon parity verified' },

    // Stealth discovery events (مَلَاذ)
    MALADH_HAJAR_NASHR: { ar: 'مَلَاذ حَجَر نَشْر', meaning: 'Dead-drop beacon published' },
    MALADH_HAJAR_LIQA: { ar: 'مَلَاذ حَجَر لِقَاء', meaning: 'Dead-drop beacon found' },
    MALADH_RAMAD_ISHARA: { ar: 'مَلَاذ رَمَاد إِشَارَة', meaning: 'Timing signal encoded' },
    MALADH_RAMAD_KASHF: { ar: 'مَلَاذ رَمَاد كَشْف', meaning: 'Timing signal detected' },
    MALADH_QINA_IRSAL: { ar: 'مَلَاذ قِنَاع إِرْسَال', meaning: 'Disguised probe sent' },
    MALADH_QINA_ISTIQBAL: { ar: 'مَلَاذ قِنَاع اِسْتِقْبَال', meaning: 'Disguised probe response received' },
    MALADH_DALIL_NASHR: { ar: 'مَلَاذ دَلِيل نَشْر', meaning: 'Stego advertisement published' },
    MALADH_DALIL_KASHF: { ar: 'مَلَاذ دَلِيل كَشْف', meaning: 'Stego advertisement discovered' },
    MALADH_GHAYBA_FATIH: { ar: 'مَلَاذ غَيْبَة فَاتِح', meaning: 'Ephemeral discovery window opened' },
    MALADH_GHAYBA_MUGHALLAQ: { ar: 'مَلَاذ غَيْبَة مُغَلَّق', meaning: 'Ephemeral discovery window closed' },
};

// Discovery terminology
export const LISAN_DISCOVERY = {
    BADIRA: { ar: 'بَادِرَة', meaning: 'Initiative - Starting discovery' },
    BADR: { ar: 'بَدْر', meaning: 'Full moon - Visibility/sharing' },
    WASAM: { ar: 'وَسْم', meaning: 'Brand - Carrier identification' },
    AMARA: { ar: 'أَمَارَة', meaning: 'Sign/Beacon - Registry presence' },
    MAWID: { ar: 'مَوْعِد', meaning: 'Appointment - Rendezvous point' },
    MANARA: { ar: 'مَنَارَة', meaning: 'Lighthouse - Peer beacon' },
    MULTAQA: { ar: 'مُلْتَقى', meaning: 'Junction - Connection selector' },
};

// Protocol layer names
export const LISAN_PROTOCOLS = {
    ZBAT: { ar: 'ظَاهِر/بَاطِن', meaning: 'Manifest/Hidden - Privacy separation' },
    MIFTAH: { ar: 'مِفْتَاح', meaning: 'Key - Encryption' },
    BARQ: { ar: 'بَرْق', meaning: 'Lightning - Fast packet transfer' },
    SAYL: { ar: 'سَيْل', meaning: 'Flow - Stream management' },
    THAQB: { ar: 'ثَقْب', meaning: 'Puncture - NAT traversal' },
    NAFADH: { ar: 'نَفَاذ', meaning: 'Penetration - NAT discovery' },
    NABD: { ar: 'نَبْض', meaning: 'Pulse - Heartbeat' },
    NAQL: { ar: 'نَقْل', meaning: 'Transport - Data transfer' },
};

/**
 * تَرْجَمَة (Tarjama) - Translate diagnostic code to human-readable text
 */
export function tarjama(code: keyof typeof LISAN_DIAGNOSTICS): string {
    const entry = LISAN_DIAGNOSTICS[code];
    return `[${entry.ar}] ${entry.meaning}`;
}

/**
 * سَجَّل (Sajjal) - Log with Lisan terminology
 */
export function sajjal(
    code: keyof typeof LISAN_DIAGNOSTICS,
    detail?: string,
    level: 'info' | 'warn' | 'error' = 'info'
): void {
    const entry = LISAN_DIAGNOSTICS[code];
    const message = `[${entry.ar}] ${entry.meaning}${detail ? ` - ${detail}` : ''}`;

    switch (level) {
        case 'error':
            console.error(message);
            break;
        case 'warn':
            console.warn(message);
            break;
        default:
            console.log(message);
    }
}

/**
 * Get random wisdom from Lisan for UI display
 */
export function getWisdom(): { ar: string; meaning: string } {
    const wisdom = [
        { ar: 'الصَّبْرُ مِفْتَاحُ الفَرَج', meaning: 'Patience is the key to relief' },
        { ar: 'العِلْمُ نُورٌ', meaning: 'Knowledge is light' },
        { ar: 'الوَقْتُ كَالسَّيْف', meaning: 'Time is like a sword' },
        { ar: 'الاِتِّحَادُ قُوَّة', meaning: 'Unity is strength' },
        { ar: 'الكَلِمَةُ الطَّيِّبَةُ صَدَقَة', meaning: 'A kind word is charity' },
    ];
    return wisdom[Math.floor(Math.random() * wisdom.length)];
}

export default {
    LISAN_DIAGNOSTICS,
    LISAN_DISCOVERY,
    LISAN_PROTOCOLS,
    tarjama,
    sajjal,
    getWisdom,
};
