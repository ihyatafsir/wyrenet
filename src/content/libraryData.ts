/**
 * WyreNet Sovereign Library & Channels (المَكْتَبَة الإِسْلَامِيَّة والقَنَوَات)
 * Complete 40 Books of Ihya Ulum al-Din by Imam Al-Ghazali & Classical Scholars Catalog
 */

export interface BookItem {
  id: number;
  quarter: string;
  quarterAr: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  sampleContentAr: string;
  sampleContentEn: string;
}

export interface ScholarChannel {
  id: string;
  nameEn: string;
  nameAr: string;
  titleEn: string;
  descEn: string;
  series: { title: string; count: number; desc: string }[];
}

export const IHYA_BOOKS: BookItem[] = [
  // Quarter 1: Worship (الرُّبْع الأَوَّل: رُبْع العِبَادَات)
  {
    id: 1,
    quarter: 'Worship',
    quarterAr: 'رُبْع العِبَادَات',
    titleEn: 'The Book of Knowledge (Kitab al-Ilm)',
    titleAr: 'كِتَاب العِلْم',
    descEn: 'The value and obligation of seeking sacred knowledge, praise of intellect, and categories of sciences.',
    sampleContentAr: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. قَالَ اللَّهُ تَعَالَى: يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ. وَقَالَ رَسُولُ اللَّهِ ﷺ: طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ.',
    sampleContentEn: 'In the name of Allah, the Most Gracious, the Most Merciful. Allah the Exalted says: "Allah will raise those who believe among you and those who were given knowledge, by degrees." The Messenger of Allah said: "Seeking knowledge is an obligation upon every Muslim."'
  },
  {
    id: 2,
    quarter: 'Worship',
    quarterAr: 'رُبْع العِبَادَات',
    titleEn: 'Foundations of the Articles of Faith (Qawaid al-Aqaid)',
    titleAr: 'كِتَاب قَوَاعِد العَقَائِد',
    descEn: 'Exposition of the creed of Ahl al-Sunnah wa al-Jamaah and principles of divine unity.',
    sampleContentAr: 'فَصْلٌ فِي بَيَانِ عَقِيدَةِ أَهْلِ السُّنَّةِ فِي كَلِمَتَيِ الشَّهَادَةِ: نَعْلَمُ وَنَجْزِمُ بِأَنَّ اللَّهَ تَعَالَى وَاحِدٌ لَا شَرِيكَ لَهُ، قَدِيمٌ لَا أَوَّلَ لَهُ، دَائِمٌ لَا آخِرَ لَهُ.',
    sampleContentEn: 'Chapter on the Creed of the People of the Sunnah: We know and affirm with certainty that Allah the Exalted is One without partner, Eternal without beginning, Everlasting without end.'
  },
  {
    id: 3,
    quarter: 'Worship',
    quarterAr: 'رُبْع العِبَادَات',
    titleEn: 'The Mysteries of Purity (Asrar al-Taharah)',
    titleAr: 'كِتَاب أَسْرَار الطَّهَارَة',
    descEn: 'The four degrees of inner and outer purification in Islamic practice.',
    sampleContentAr: 'الطَّهَارَةُ لَهَا أَرْبَعُ مَرَاتِبَ: الْمَرْتَبَةُ الْأُولَى: تَطْهِيرُ الظَّاهِرِ عَنِ الْأَحْدَاثِ وَالْأَنْجَاسِ. الثَّانِيَةُ: تَطْهِيرُ الْجَوَارِحِ عَنِ الْجَرَائِمِ وَالْآثَامِ. الثَّالِثَةُ: تَطْهِيرُ الْقَلْبِ عَنِ الْأَخْلَاقِ الْمَذْمُومَةِ. الرَّابِعَةُ: تَطْهِيرُ السِّرِّ عَمَّا سِوَى اللَّهِ تَعَالَى.',
    sampleContentEn: 'Purification has four degrees: 1. Purifying the outward body from physical impurities. 2. Purifying bodily limbs from sins. 3. Purifying the heart from blameworthy character traits. 4. Purifying the inmost secret from all that is besides Allah.'
  },
  {
    id: 4,
    quarter: 'Worship',
    quarterAr: 'رُبْع العِبَادَات',
    titleEn: 'The Mysteries of Prayer (Asrar al-Salah)',
    titleAr: 'كِتَاب أَسْرَار الصَّلَاة',
    descEn: 'Inner states, presence of the heart (khushu), and spiritual realities of prayer.',
    sampleContentAr: 'اعْلَمْ أَنَّ رُوحَ الصَّلَاةِ وَحَيَاتَهَا هُوَ حُضُورُ الْقَلْبِ وَالْخُشُوعُ وَالتَّعْظِيمُ وَالْهَيْبَةُ وَالرَّجَاءُ وَالْحَيَاءُ.',
    sampleContentEn: 'Know that the soul and life of prayer is presence of the heart, humility (khushu), reverence, awe, hope, and modesty before the Creator.'
  },
  {
    id: 5,
    quarter: 'Worship',
    quarterAr: 'رُبْع العِبَادَات',
    titleEn: 'The Mysteries of Zakat (Asrar al-Zakat)',
    titleAr: 'كِتَاب أَسْرَار الزَّكَاة',
    descEn: 'Purification of wealth, testing of divine love, and etiquette of charity.',
    sampleContentAr: 'فِي الزَّكَاةِ تَمْحِيصٌ لِدَعْوَى مَحَبَّةِ اللَّهِ تَعَالَى، وَتَطْهِيرٌ لِلنَّفْسِ عَنْ رَذِيلَةِ الْبُخْلِ، وَشُكْرٌ لِنِعْمَةِ الْمَالِ.',
    sampleContentEn: 'Zakat serves as a test of the claim of loving Allah, purifies the soul from the vice of stinginess, and constitutes gratitude for the blessing of wealth.'
  },
  {
    id: 6,
    quarter: 'Worship',
    quarterAr: 'رُبْع العِبَادَات',
    titleEn: 'The Mysteries of Fasting (Asrar al-Sawm)',
    titleAr: 'كِتَاب أَسْرَار الصَّوْم',
    descEn: 'Fasting of the general public, the select, and the elite of the select.',
    sampleContentAr: 'الصَّوْمُ ثَلَاثُ دَرَجَاتٍ: صَوْمُ الْعُمُومِ، وَصَوْمُ الْخُصُوصِ، وَصَوْمُ خُصُوصِ الْخُصُوصِ.',
    sampleContentEn: 'Fasting has three degrees: The fasting of the general public (refraining from food and desires), the fasting of the select (guarding the limbs from sins), and the fasting of the elite (guarding the heart from worldly distractions).'
  },
  {
    id: 7,
    quarter: 'Worship',
    quarterAr: 'رُبْع العِبَادَات',
    titleEn: 'The Mysteries of Pilgrimage (Asrar al-Hajj)',
    titleAr: 'كِتَاب أَسْرَار الحَجّ',
    descEn: 'Spiritual symbolism of the Kaaba, Safa and Marwa, Arafat, and casting stones.',
    sampleContentAr: 'الْحَجُّ عِبَادَةُ الْعُمْرِ وَخَاتِمَةُ الْأَمْرِ، وَفِيهِ إِظْهَارُ الِانْقِيَادِ وَالْعُبُودِيَّةِ الْمُطْلَقَةِ لِلَّهِ تَعَالَى.',
    sampleContentEn: 'Hajj is the worship of a lifetime and the culmination of divine devotion, embodying absolute submission and servant hood to Allah.'
  },
  {
    id: 8,
    quarter: 'Worship',
    quarterAr: 'رُبْع العِبَادَات',
    titleEn: 'Etiquettes of Quran Recitation (Adab Tilawat al-Quran)',
    titleAr: 'كِتَاب آدَاب تِلَاوَة القُرْآن',
    descEn: 'Outer and inner manners of engaging with the Holy Quran.',
    sampleContentAr: 'مِنْ آدَابِ التِّلَاوَةِ الْفَهْمُ وَالتَّدَبُّرُ وَالتَّأَثُّرُ بِكُلِّ آيَةٍ بِحَسَبِهَا مِنَ الْوَعْدِ وَالْوَعِيدِ.',
    sampleContentEn: 'Among the etiquettes of recitation are deep contemplation, comprehension, and allowing the heart to be moved by every promise and warning.'
  },
  {
    id: 9,
    quarter: 'Worship',
    quarterAr: 'رُبْع العِبَادَات',
    titleEn: 'Invocations and Supplications (Kitab al-Adhkar wa al-Daawat)',
    titleAr: 'كِتَاب الأَذْكَار والدَّعَوَات',
    descEn: 'Remembrance of Allah, daily litanies, and conditions for answered prayers.',
    sampleContentAr: 'الذِّكْرُ هُوَ مَنْشُورُ الْوِلَايَةِ وَسَبَبُ الْقُرْبِ مِنَ الْحَقِّ سُبْحَانَهُ وَتَعَالَى.',
    sampleContentEn: 'Remembrance (dhikr) is the diploma of sainthood and the primary cause of proximity to the Divine Reality.'
  },
  {
    id: 10,
    quarter: 'Worship',
    quarterAr: 'رُبْع العِبَادَات',
    titleEn: 'The Daily Litanies and Allocation of Time (Tartib al-Awrad)',
    titleAr: 'كِتَاب تَرْتِيب الأَوْرَاد',
    descEn: 'Structuring the day and night in perpetual remembrance and righteous works.',
    sampleContentAr: 'يَنْبَغِي لِلْعَبْدِ أَنْ يُقَسِّمَ أَوْقَاتَهُ وَيُرَتِّبَ أَوْرَادَهُ فَلَا يَتْرُكَ سَاعَةً مِنْ عُمْرِهِ فِي غَيْرِ طَاعَةٍ.',
    sampleContentEn: 'The servant should organize their time and structure their daily litanies so that not an hour of life passes outside of divine obedience.'
  },

  // Quarter 2: Daily Life (الرُّبْع الثَّانِي: رُبْع العَادَات)
  {
    id: 11,
    quarter: 'Daily Life',
    quarterAr: 'رُبْع العَادَات',
    titleEn: 'Etiquette of Eating and Hospitality (Adab al-Akl)',
    titleAr: 'كِتَاب آدَاب الأَكْل',
    descEn: 'Manners of dining, intention, sharing food, and hosting guests.',
    sampleContentAr: 'الْمَقْصُودُ مِنَ الْأَكْلِ التَّقَوِّي عَلَى طَاعَةِ اللَّهِ تَعَالَى لَا اسْتِيفَاءُ الشَّهَوَاتِ.',
    sampleContentEn: 'The true purpose of eating is to gain physical strength for divine worship, not mere indulgence in pleasures.'
  },
  {
    id: 12,
    quarter: 'Daily Life',
    quarterAr: 'رُبْع العَادَات',
    titleEn: 'Etiquette of Marriage and Family (Adab al-Nikah)',
    titleAr: 'كِتَاب آدَاب النِّكَاح',
    descEn: 'Spiritual guidelines for marriage, mutual rights, and raising righteous children.',
    sampleContentAr: 'النِّكَاحُ حِصْنٌ لِلدِّينِ وَعَوْنٌ عَلَى الْعَفَافِ وَإِقَامَةٌ لِسُنَّةِ الْمُرْسَلِينَ.',
    sampleContentEn: 'Marriage is a fortress for faith, an aid toward chastity, and fulfillment of the prophetic tradition.'
  },
  {
    id: 13,
    quarter: 'Daily Life',
    quarterAr: 'رُبْع العَادَات',
    titleEn: 'Etiquette of Earning a Livelihood (Adab al-Kasb)',
    titleAr: 'كِتَاب آدَاب الكَسْب والمَعَاش',
    descEn: 'Halal transactions, market ethics, avoidance of usury (riba), and honesty in trade.',
    sampleContentAr: 'الْكَاسِبُ بِالْحَلَالِ لِيَسْتَغْنِيَ عَنِ النَّاسِ وَيَقُومَ بِعِيَالِهِ فِي سَبِيلِ اللَّهِ تَعَالَى.',
    sampleContentEn: 'The one who earns lawfully to remain independent of people and sustain their family is in the path of Allah.'
  },
  {
    id: 14,
    quarter: 'Daily Life',
    quarterAr: 'رُبْع العَادَات',
    titleEn: 'The Lawful and the Unlawful (Al-Halal wa al-Haram)',
    titleAr: 'كِتَاب الحَلَال والحَرَام',
    descEn: 'Scrupulous avoidance of doubtful matters (wara) and levels of moral purity.',
    sampleContentAr: 'دَرَجَاتُ الْوَرَعِ أَرْبَعٌ: وَرَعُ الْعُدُولِ، وَوَرَعُ الصَّالِحِينَ، وَوَرَعُ الْمُتَّقِينَ، وَوَرَعُ الصِّدِّيقِينَ.',
    sampleContentEn: 'Degrees of scrupulous piety (wara) are four: The piety of the upright, the piety of the righteous, the piety of the God-fearing, and the piety of the truthful (siddiqin).'
  },
  {
    id: 15,
    quarter: 'Daily Life',
    quarterAr: 'رُبْع العَادَات',
    titleEn: 'Etiquette of Brotherhood and Fellowship (Adab al-Ukhuwwah)',
    titleAr: 'كِتَاب آدَاب الأُلْفَة والأُخُوَّة',
    descEn: 'Rights of spiritual friendship, companionship, and communal harmony.',
    sampleContentAr: 'الْأُخُوَّةُ فِي اللَّهِ رَابِطَةٌ قُدْسِيَّةٌ تُثْمِرُ التَّعَاوُنَ عَلَى الْبِرِّ وَالتَّقْوَى.',
    sampleContentEn: 'Brotherhood for the sake of Allah is a sacred bond that yields mutual cooperation upon righteousness and piety.'
  },
  {
    id: 16,
    quarter: 'Daily Life',
    quarterAr: 'رُبْع العَادَات',
    titleEn: 'Etiquette of Seclusion vs Sociability (Adab al-Uzlah)',
    titleAr: 'كِتَاب آدَاب العُزْلَة',
    descEn: 'Balancing spiritual solitude for reflection and social engagement for community service.',
    sampleContentAr: 'فِي الْعُزْلَةِ فَوَائِدُ وَآفَاتٌ، وَالْحَاذِقُ مَنْ يَأْخُذُ بِفَوَائِدِهَا وَيَتَجَنَّبُ آفَاتِهَا.',
    sampleContentEn: 'In seclusion there are benefits and perils; the wise person attains its benefits while safeguarding against its pitfalls.'
  },
  {
    id: 17,
    quarter: 'Daily Life',
    quarterAr: 'رُبْع العَادَات',
    titleEn: 'Etiquette of Travel (Adab al-Safar)',
    titleAr: 'كِتَاب آدَاب السَّفَر',
    descEn: 'Outer and inner purposes of travel in search of knowledge and sacred lessons.',
    sampleContentAr: 'السَّفَرُ سَفَرَانِ: سَفَرٌ بِالْبَدَنِ فِي الْأَرْضِ، وَسَفَرٌ بِالْقَلْبِ إِلَى اللَّهِ تَعَالَى.',
    sampleContentEn: 'Travel is twofold: Physical journeying across the earth, and spiritual journeying of the heart to Allah.'
  },
  {
    id: 18,
    quarter: 'Daily Life',
    quarterAr: 'رُبْع العَادَات',
    titleEn: 'Audition and Spiritual Song (Adab al-Sama wa al-Wajd)',
    titleAr: 'كِتَاب آدَاب السَّمَاع والوَجْد',
    descEn: 'Spiritual listening, devotional poetry, and emotional states in remembrance.',
    sampleContentAr: 'السَّمَاعُ يُثِيرُ مَا فِي الْقَلْبِ، فَإِنْ كَانَ فِيهِ حُبُّ اللَّهِ هَاجَ وَاشْتَاقَ.',
    sampleContentEn: 'Spiritual listening stirs whatever resides within the heart; if divine love is within, it increases in yearning.'
  },
  {
    id: 19,
    quarter: 'Daily Life',
    quarterAr: 'رُبْع العَادَات',
    titleEn: 'Enjoining Good and Forbidding Evil (Al-Amr bi al-Maruf)',
    titleAr: 'كِتَاب الأَمْر بالمَعْرُوف والنَّهْي عَن المُنْكَر',
    descEn: 'Conditions, wisdom, stages, and gentleness in communal reform.',
    sampleContentAr: 'الْأَمْرُ بِالْمَعْرُوفِ قُطْبُ الدِّينِ الْأَعْظَمُ، وَهُوَ الْمُهِمُّ الَّذِي ابْتَعَثَ اللَّهُ لَهُ النَّبِيِّينَ.',
    sampleContentEn: 'Enjoining the good and forbidding evil is the greatest axis of faith, for which prophets were sent.'
  },
  {
    id: 20,
    quarter: 'Daily Life',
    quarterAr: 'رُبْع العَادَات',
    titleEn: 'Prophetic Character and Manners (Adab al-Nubuwwah)',
    titleAr: 'كِتَاب آدَاب النُّبُوَّة وأَخْلَاق الرَّسُول ﷺ',
    descEn: 'The sublime noble character, humility, compassion, and forbearance of the Prophet.',
    sampleContentAr: 'كَانَ خُلُقُهُ الْقُرْآنَ، أَحْلَمَ النَّاسِ وَأَشْجَعَهُمْ وَأَعْدَلَهُمْ وَأَعَفَّهُمْ.',
    sampleContentEn: 'His character was the Quran; he was the most forbearing, courageous, just, and modest of mankind.'
  },

  // Quarter 3: Vices & Destructive Traits (الرُّبْع الثَّالِث: رُبْع المَهْلِكَات)
  {
    id: 21,
    quarter: 'Vices',
    quarterAr: 'رُبْع المَهْلِكَات',
    titleEn: 'The Wonders of the Heart (Ajaib al-Qalb)',
    titleAr: 'كِتَاب شَرْح عَجَائِب القَلْب',
    descEn: 'Anatomy of the spiritual heart, subtle whisperings, and divine inspirations.',
    sampleContentAr: 'الْقَلْبُ مَحَلُّ مَعْرِفَةِ اللَّهِ تَعَالَى وَمِرْآةُ تَجَلِّي الْحَقَائِقِ إِذَا سَلِمَ مِنَ الرَّيْنِ.',
    sampleContentEn: 'The heart is the sanctuary for the knowledge of Allah and a mirror reflecting divine realities when purified from stains.'
  },
  {
    id: 22,
    quarter: 'Vices',
    quarterAr: 'رُبْع المَهْلِكَات',
    titleEn: 'Disciplining the Soul (Riyadat al-Nafs)',
    titleAr: 'كِتَاب رِيَاضَة النَّفْس وتَهْذِيب الأَخْلَاق',
    descEn: 'Spiritual therapeutics, breaking compulsive habits, and attaining moral excellence.',
    sampleContentAr: 'تَهْذِيبُ الْأَخْلَاقِ مُمْكِنٌ بِالْمُجَاهَدَةِ وَالتَّدْرِيبِ كَمَا يُرَوَّضُ الْمُهْرُ الصَّعْبُ.',
    sampleContentEn: 'Refinement of character is achievable through spiritual striving and habituation, just as a wild steed is trained.'
  },
  {
    id: 23,
    quarter: 'Vices',
    quarterAr: 'رُبْع المَهْلِكَات',
    titleEn: 'Breaking the Desires of Appetite and Carnality (Kasr al-Shahwatayn)',
    titleAr: 'كِتَاب كَسْر الشَّهْوَتَيْن',
    descEn: 'Overcoming excessive eating and sensual impulses through temperance.',
    sampleContentAr: 'الْبِطْنَةُ تُذْهِبُ الْفِطْنَةَ، وَالْجُوعُ يُنَوِّرُ الْقَلْبَ وَيَصْقُلُ الْفِكْرَ.',
    sampleContentEn: 'Overeating dulls intelligence, whereas conscious restraint illumines the heart and sharpens contemplation.'
  },
  {
    id: 24,
    quarter: 'Vices',
    quarterAr: 'رُبْع المَهْلِكَات',
    titleEn: 'Vices of the Tongue (Afat al-Lisan)',
    titleAr: 'كِتَاب آفَات اللِّسَان',
    descEn: 'Twenty spiritual dangers of speech: backbiting, lying, mockery, flattery, and vain debate.',
    sampleContentAr: 'اللِّسَانُ صَغِيرٌ جِرْمُهُ عَظِيمٌ جُرْمُهُ، وَمَنْ صَمَتَ نَجَا.',
    sampleContentEn: 'The tongue is small in its physical size but immense in its potential harm; whoever maintains silence is saved.'
  },
  {
    id: 25,
    quarter: 'Vices',
    quarterAr: 'رُبْع المَهْلِكَات',
    titleEn: 'Condemnation of Anger, Malice, and Envy (Dhamm al-Ghadab)',
    titleAr: 'كِتَاب ذَمّ الغَضَب والحِقْد والحَسَد',
    descEn: 'Curing destructive temper, grudges, and the venom of envy.',
    sampleContentAr: 'الْحَسَدُ يَأْكُلُ الْحَسَنَاتِ كَمَا تَأْكُلُ النَّارُ الْحَطَبَ.',
    sampleContentEn: 'Envy consumes good deeds just as fire consumes dry wood.'
  },
  {
    id: 26,
    quarter: 'Vices',
    quarterAr: 'رُبْع المَهْلِكَات',
    titleEn: 'Condemnation of Worldliness (Dhamm al-Dunya)',
    titleAr: 'كِتَاب ذَمّ الدُّنْيَا',
    descEn: 'Understanding the transient nature of the world compared to eternal life.',
    sampleContentAr: 'الدُّنْيَا مَزْرَعَةُ الْآخِرَةِ، مَنْ أَخَذَ مِنْهَا قَدْرَ الْبَلَاغِ نَجَا، وَمَنِ اسْتَكْثَرَ هَلَكَ.',
    sampleContentEn: 'This world is the sowing ground for the Hereafter; whoever takes what is sufficient is saved, and whoever hoards is ruined.'
  },
  {
    id: 27,
    quarter: 'Vices',
    quarterAr: 'رُبْع المَهْلِكَات',
    titleEn: 'Condemnation of Avarice and Love of Wealth (Dhamm al-Bukhl)',
    titleAr: 'كِتَاب ذَمّ البُخْل وحُبّ المَال',
    descEn: 'Spiritual illness of stinginess, obsession with accumulation, and the cure of generous giving.',
    sampleContentAr: 'الْمَالُ كَالْحَيَّةِ فِيهِ سُمٌّ وَفِيهِ تِرْيَاقٌ، فَسُمُّهُ الطَّمَعُ وَتِرْيَاقُهُ الْإِنْفَاقُ.',
    sampleContentEn: 'Wealth is like a serpent containing venom and antidote: Its venom is greed, and its antidote is generous spending.'
  },
  {
    id: 28,
    quarter: 'Vices',
    quarterAr: 'رُبْع المَهْلِكَات',
    titleEn: 'Condemnation of Fame and Ostentation (Dhamm al-Jah wa al-Riya)',
    titleAr: 'كِتَاب ذَمّ الجَاه والرِّيَاء',
    descEn: 'Diagnosis of seeking public acclaim and the hidden association with pride.',
    sampleContentAr: 'الرِّيَاءُ هُوَ الشِّرْكُ الْخَفِيُّ، وَالْإِخْلَاصُ سِرٌّ بَيْنَ الْعَبْدِ وَرَبِّهِ.',
    sampleContentEn: 'Ostentation (riya) is subtle idolatry, while sincerity is an inviolable secret between the servant and their Lord.'
  },
  {
    id: 29,
    quarter: 'Vices',
    quarterAr: 'رُبْع المَهْلِكَات',
    titleEn: 'Condemnation of Pride and Self-Admiration (Dhamm al-Kibr wa al-Ujb)',
    titleAr: 'كِتَاب ذَمّ الكِبْر والعُجْب',
    descEn: 'Eradicating arrogance, feeling superior to others, and vanity.',
    sampleContentAr: 'الْكِبْرُ بَطَرُ الْحَقِّ وَغَمْطُ النَّاسِ، وَلَا يَدْخُلُ الْجَنَّةَ مَنْ كَانَ فِي قَلْبِهِ مِثْقَالُ ذَرَّةٍ مِنْ كِبْرٍ.',
    sampleContentEn: 'Pride is rejecting truth and looking down upon people; no one enters Paradise who possesses a grain of arrogance in their heart.'
  },
  {
    id: 30,
    quarter: 'Vices',
    quarterAr: 'رُبْع المَهْلِكَات',
    titleEn: 'Condemnation of Delusion and Vanity (Dhamm al-Ghurur)',
    titleAr: 'كِتَاب ذَمّ الغُرُور',
    descEn: 'Exposing spiritual false securities among scholars, worshippers, ascetics, and the affluent.',
    sampleContentAr: 'الْمَغْرُورُ مَنْ رَكَنَ إِلَى عَمَلِهِ وَأَمِنَ مَكْرَ اللَّهِ تَعَالَى.',
    sampleContentEn: 'The deluded person is one who relies on their own outward deeds and assumes false security before Allah.'
  },

  // Quarter 4: Virtues & Saving Traits (الرُّبْع الرَّابِع: رُبْع المُنْجِيَات)
  {
    id: 31,
    quarter: 'Virtues',
    quarterAr: 'رُبْع المُنْجِيَات',
    titleEn: 'Repentance (Kitab al-Tawbah)',
    titleAr: 'كِتَاب التَّوْبَة',
    descEn: 'The nature of repentance, remorse, restitution, and turning back to Allah.',
    sampleContentAr: 'التَّوْبَةُ رُكْنُهَا الْأَعْظَمُ النَّدَمُ، وَشَرْطُهَا الْإِقْلَاعُ عَنِ الذَّنْبِ وَالْعَزْمُ عَلَى عَدَمِ الْعَوْدِ.',
    sampleContentEn: 'Repentance rests on remorse, cessation of the sin, and a resolute commitment never to return to it.'
  },
  {
    id: 32,
    quarter: 'Virtues',
    quarterAr: 'رُبْع المُنْجِيَات',
    titleEn: 'Patience and Gratitude (Al-Sabr wa al-Shukr)',
    titleAr: 'كِتَاب الصَّبْر والشُّكْر',
    descEn: 'The twin wings of faith: enduring tribulations and recognizing divine benevolence.',
    sampleContentAr: 'الْإِيمَانُ نِصْفَانِ: نِصْفٌ صَبْرٌ، وَنِصْفٌ شُكْرٌ.',
    sampleContentEn: 'Faith consists of two halves: One half is patience, and the other half is gratitude.'
  },
  {
    id: 33,
    quarter: 'Virtues',
    quarterAr: 'رُبْع المُنْجِيَات',
    titleEn: 'Fear and Hope (Al-Khawf wa al-Raja)',
    titleAr: 'كِتَاب الخَوْف والرَّجَاء',
    descEn: 'Balancing reverent awe of divine majesty and boundless trust in divine mercy.',
    sampleContentAr: 'الْخَوْفُ وَالرَّجَاءُ كَجَنَاحَيِ الطَّائِرِ، إِذَا اسْتَوَيَا اسْتَوَى الطَّيَرَانُ وَتَمَّ الِانْطِلَاقُ.',
    sampleContentEn: 'Fear and hope are like the two wings of a bird; when balanced, flight is steady and true.'
  },
  {
    id: 34,
    quarter: 'Virtues',
    quarterAr: 'رُبْع المُنْجِيَات',
    titleEn: 'Poverty and Asceticism (Al-Faqr wa al-Zuhd)',
    titleAr: 'كِتَاب الفَقْر والزُّهْد',
    descEn: 'Inner detachment from worldly possessions and finding wealth in Allah.',
    sampleContentAr: 'الزُّهْدُ فِي الدُّنْيَا رَاحَةُ الْقَلْبِ وَالْبَدَنِ، وَهُوَ فَرَاغُ الْقَلْبِ عَمَّا خَلَتْ مِنْهُ الْيَدُ.',
    sampleContentEn: 'True asceticism (zuhd) brings tranquility to the heart; it means emptying the heart of what the hands do not possess.'
  },
  {
    id: 35,
    quarter: 'Virtues',
    quarterAr: 'رُبْع المُنْجِيَات',
    titleEn: 'Divine Unity and Reliance (Al-Tawhid wa al-Tawakkul)',
    titleAr: 'كِتَاب التَّوْحِيد والتَّوَكُّل',
    descEn: 'Pure monotheism in causation and unwavering reliance upon the Almighty.',
    sampleContentAr: 'حَقِيقَةُ التَّوَكُّلِ سُكُونُ الْقَلْبِ إِلَى وَكِيلِهِ، وَعِلْمُهُ بِأَنَّ مَا أَصَابَهُ لَمْ يَكُنْ لِيُخْطِئَهُ.',
    sampleContentEn: 'The reality of reliance (tawakkul) is the heart resting serene in its Trustee, knowing that what reached you was never meant to miss you.'
  },
  {
    id: 36,
    quarter: 'Virtues',
    quarterAr: 'رُبْع المُنْجِيَات',
    titleEn: 'Love, Longing, Intimacy, and Contentment (Al-Mahabbah wa al-Shawq)',
    titleAr: 'كِتَاب المَحَبَّة والشَّوْق والأُنْس والرِّضَا',
    descEn: 'The supreme summit of spiritual realization: loving Allah above all creation.',
    sampleContentAr: 'مَحَبَّةُ اللَّهِ هِيَ الْغَايَةُ الْقُصْوَى مِنَ الْمَقَامَاتِ، وَالذُّرْوَةُ الْعُلْيَا مِنَ الدَّرَجَاتِ.',
    sampleContentEn: 'Love of Allah is the utmost station and the supreme summit of spiritual degrees.'
  },
  {
    id: 37,
    quarter: 'Virtues',
    quarterAr: 'رُبْع المُنْجِيَات',
    titleEn: 'Intention, Sincerity, and Truthfulness (Al-Niyyah wa al-Ikhlas)',
    titleAr: 'كِتَاب النِّيَّة والإِخْلَاص والصِّدْق',
    descEn: 'Purity of motivation, singling out the Divine in all deeds, and absolute integrity.',
    sampleContentAr: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَالنِّيَّةُ الصَّالِحَةُ تُحَوِّلُ الْعَادَاتِ إِلَى عِبَادَاتٍ.',
    sampleContentEn: 'Actions are judged solely by intentions, and a sincere intention transforms ordinary habits into worship.'
  },
  {
    id: 38,
    quarter: 'Virtues',
    quarterAr: 'رُبْع المُنْجِيَات',
    titleEn: 'Vigilance and Self-Accounting (Al-Muraqabah wa al-Muhasabah)',
    titleAr: 'كِتَاب المُرَاقَبَة والمُحَاسَبَة',
    descEn: 'Six stages of self-examination: Musharatah, Muraqabah, Muhasabah, Muaqabah, Mujahadah, and Muatabah.',
    sampleContentAr: 'مَرَاحِلُ الْمُرَاقَبَةِ سِتٌّ: الْمُشَارَطَةُ قَبْلَ الْعَمَلِ، وَالْمُرَاقَبَةُ مَعَهُ، وَالْمُحَاسَبَةُ بَعْدَهُ.',
    sampleContentEn: 'The stages of self-vigilance are six: Stipulation before action, vigilance during action, and self-reckoning following action.'
  },
  {
    id: 39,
    quarter: 'Virtues',
    quarterAr: 'رُبْع المُنْجِيَات',
    titleEn: 'Contemplation and Reflection (Kitab al-Tafakkur)',
    titleAr: 'كِتَاب التَّفَكُّر',
    descEn: 'Contemplating the signs of creation and the subtle wisdom of the Creator.',
    sampleContentAr: 'تَفَكُّرُ سَاعَةٍ خَيْرٌ مِنْ عِبَادَةِ سَنَةٍ؛ لِأَنَّهُ يُنِيرُ الْبَصِيرَةَ وَيُعَظِّمُ الْخَالِقَ فِي الْقَلْبِ.',
    sampleContentEn: 'An hour of deep spiritual contemplation exceeds a year of routine worship, for it illumines inner sight and magnifies the Creator within the soul.'
  },
  {
    id: 40,
    quarter: 'Virtues',
    quarterAr: 'رُبْع المُنْجِيَات',
    titleEn: 'Remembrance of Death and the Afterlife (Dhikr al-Mawt)',
    titleAr: 'كِتَاب ذِكْر المَوْت ومَا بَعْدَه',
    descEn: 'Preparation for the final journey, the realities of the Grave, Resurrection, and Paradise.',
    sampleContentAr: 'اكْثِرُوا مِنْ ذِكْرِ هَاذِمِ اللَّذَّاتِ: الْمَوْتِ، فَإِنَّهُ يَشْحَذُ الْهِمَمَ وَيُوقِظُ الْغَافِلِينَ.',
    sampleContentEn: 'Frequently remember the destroyer of ephemeral pleasures: death, for it awakens the heedless and elevates spiritual resolve.'
  }
];

export const SCHOLAR_CHANNELS: ScholarChannel[] = [
  {
    id: 'ghazali',
    nameEn: 'Imam Abu Hamid Al-Ghazali',
    nameAr: 'الإِمَام أَبُو حَامِد الغَزَالِي (حُجَّة الإِسْلَام)',
    titleEn: 'Hujjat al-Islam • Master of Epistemology & Spiritual Therapeutics',
    descEn: 'Author of Ihya Ulum al-Din, Tahafut al-Falasifa, Al-Mustasfa, and Al-Munqidh min al-Dalal.',
    series: [
      { title: 'Ihya Ulum al-Din (Revival of Islamic Sciences)', count: 40, desc: 'Complete 4-quarter masterwork on worship, daily ethics, vices, and virtues.' },
      { title: 'Al-Munqidh min al-Dalal (Deliverance from Error)', count: 6, desc: 'Epistemological autobiography and defense of direct spiritual gnosis.' },
      { title: 'Bidayat al-Hidayah (Beginning of Guidance)', count: 12, desc: 'Daily devotional guide and inner disciplines for the seeker.' }
    ]
  },
  {
    id: 'asrar',
    nameEn: 'Shaykh Asrar Rashid',
    nameAr: 'الشَّيْخ أَسْرَار رَشِيد',
    titleEn: 'Theologian, Faqih, Logician • Ahl al-Sunnah wa al-Jamaah',
    descEn: 'Senior scholar of Kalam, Logic (Mantiq), Hanafi Fiqh, and contemporary philosophical refutations.',
    series: [
      { title: 'Islam and Secular Reason', count: 18, desc: 'Epistemic defense of classical Islamic metaphysics against positivism.' },
      { title: 'Commentary on Al-Aqidah al-Tahawiyyah', count: 24, desc: 'Comprehensive exposition of the classical creed of Ahl al-Sunnah.' },
      { title: 'Mantiq: Classical Aristotelian-Arabic Logic', count: 14, desc: 'Rigorous training in syllogistic logic, fallacies, and dialectics.' }
    ]
  },
  {
    id: 'ahmad',
    nameEn: 'Shaykh Ahmad',
    nameAr: 'الشَّيْخ أَحْمَد',
    titleEn: 'Spiritual Guide • Al-Hikma wa al-Tazkiyah',
    descEn: 'Discourses on Hikam Ibn Ata Allah, purification of intention, and classical Sufism.',
    series: [
      { title: 'Hikam Ibn Ata Allah Explained', count: 30, desc: 'Spiritual aphorisms on divine reliance and detachment.' },
      { title: 'The Ladder of the Spiritual Traveler', count: 15, desc: 'Systematic progression through the stations of the soul.' }
    ]
  },
  {
    id: 'hamza',
    nameEn: 'Shaykh Hamza Yusuf',
    nameAr: 'الشَّيْخ حَمْزَة يُوسُف',
    titleEn: 'President of Zaytuna College • Educator & Translator',
    descEn: 'Lectures on Purification of the Heart, Matn Ibn Ashir, Classical Rhetoric, and Ethics.',
    series: [
      { title: 'Purification of the Heart (Matharat al-Qulub)', count: 22, desc: 'Diagnosing diseases of the spiritual heart and their classical cures.' },
      { title: 'Al-Murshid al-Muin (Matn Ibn Ashir)', count: 28, desc: 'Comprehensive study of Maliki Fiqh, Ashari Aqeedah, and Junaydi Tasawwuf.' },
      { title: 'Trivium & The Liberal Arts in Islamic Pedagogy', count: 8, desc: 'Grammar, Logic, and Rhetoric as foundational tools of sacred scholarship.' }
    ]
  }
];

// ==============================================================================
// Classical Corpus v4 & v5 Authenticated Digital Manifest
// Populated directly from wyresup / wyrenet_classical_corpus_l1_manifest.json
// ==============================================================================

import manifest from './classicalCorpusManifest.json';

export interface CorpusBook {
  index: number;
  filename: string;
  title: string;
  arabic_title: string;
  author: string;
  category: string;
  channelId: string;
  sizeMb: string;
  version: 'v4' | 'v5';
  edition: string;
  edition_format: string;
  is_pure_en: boolean;
  is_bilingual: boolean;
  is_v4_v5: boolean;
  imam_key: 'razi' | 'ghazali' | 'nawawi' | 'raghib' | 'heritage';
  topic_key: string;
  downloadUrl: string;
}

export const CLASSICAL_CORPUS: CorpusBook[] = (manifest as any).books.map((b: any) => ({
  ...b,
  downloadUrl: `/epubs/${b.filename}`,
}));

export interface ImamInfo {
  key: 'all' | 'razi' | 'ghazali' | 'nawawi' | 'raghib' | 'heritage';
  nameEn: string;
  nameAr: string;
  years: string;
  channelId: string;
  v4Count: number;
  v5Count: number;
  totalCount: number;
}

export const IMAMS_METADATA: ImamInfo[] = [
  {
    key: 'razi',
    nameEn: 'Imam Fakhr al-Din al-Razi',
    nameAr: 'الإمام فخر الدين الرازي',
    years: '544–606 AH',
    channelId: 'imam-razi',
    v4Count: CLASSICAL_CORPUS.filter(b => b.imam_key === 'razi' && b.version === 'v4').length,
    v5Count: CLASSICAL_CORPUS.filter(b => b.imam_key === 'razi' && b.version === 'v5').length,
    totalCount: CLASSICAL_CORPUS.filter(b => b.imam_key === 'razi').length,
  },
  {
    key: 'ghazali',
    nameEn: 'Imam Abu Hamid al-Ghazali',
    nameAr: 'الإمام أبو حامد الغزالي',
    years: '450–505 AH',
    channelId: 'abuhamed',
    v4Count: CLASSICAL_CORPUS.filter(b => b.imam_key === 'ghazali' && b.version === 'v4').length,
    v5Count: CLASSICAL_CORPUS.filter(b => b.imam_key === 'ghazali' && b.version === 'v5').length,
    totalCount: CLASSICAL_CORPUS.filter(b => b.imam_key === 'ghazali').length,
  },
  {
    key: 'nawawi',
    nameEn: 'Imam Yahya al-Nawawi',
    nameAr: 'الإمام يحيى بن شرف النووي',
    years: '631–676 AH',
    channelId: 'imam-nawawi',
    v4Count: CLASSICAL_CORPUS.filter(b => b.imam_key === 'nawawi' && b.version === 'v4').length,
    v5Count: CLASSICAL_CORPUS.filter(b => b.imam_key === 'nawawi' && b.version === 'v5').length,
    totalCount: CLASSICAL_CORPUS.filter(b => b.imam_key === 'nawawi').length,
  },
  {
    key: 'raghib',
    nameEn: 'Imam al-Raghib al-Isfahani',
    nameAr: 'الإمام الراغب الأصفهاني',
    years: 'd. 502 AH',
    channelId: 'classical-heritage',
    v4Count: CLASSICAL_CORPUS.filter(b => b.imam_key === 'raghib' && b.version === 'v4').length,
    v5Count: CLASSICAL_CORPUS.filter(b => b.imam_key === 'raghib' && b.version === 'v5').length,
    totalCount: CLASSICAL_CORPUS.filter(b => b.imam_key === 'raghib').length,
  },
  {
    key: 'heritage',
    nameEn: 'Classical Heritage & Scholars',
    nameAr: 'تراث العلماء والأئمة',
    years: 'Classical Corpus',
    channelId: 'classical-heritage',
    v4Count: CLASSICAL_CORPUS.filter(b => b.imam_key === 'heritage' && b.version === 'v4').length,
    v5Count: CLASSICAL_CORPUS.filter(b => b.imam_key === 'heritage' && b.version === 'v5').length,
    totalCount: CLASSICAL_CORPUS.filter(b => b.imam_key === 'heritage').length,
  },
];
