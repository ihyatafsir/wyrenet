/**
 * LibraryScreen.tsx - WyreNet Sovereign Library & Classical Corpus (v4 & v5)
 * المَكْتَبَة التُّرَاثِيَّة اللَّامَرْكَزِيَّة وقَنَوَات العُلَمَاء
 * Complete Authenticated Corpus of All 5 Imams: Al-Razi, Al-Ghazali, Al-Nawawi, Al-Raghib, Heritage
 * Zero domain reliance. Zero emojis. Strict typographic sovereign aesthetic.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import {
  IHYA_BOOKS,
  SCHOLAR_CHANNELS,
  BookItem,
  ScholarChannel,
  CLASSICAL_CORPUS,
  CorpusBook,
  IMAMS_METADATA,
} from '../content/libraryData';

export default function LibraryScreen() {
  const [mainTab, setMainTab] = useState<'corpus' | 'ihya' | 'channels'>('corpus');
  const [selectedImam, setSelectedImam] = useState<string>('all');
  const [selectedVersion, setSelectedVersion] = useState<'all' | 'v5' | 'v4'>('all');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [activeCorpusBook, setActiveCorpusBook] = useState<CorpusBook | null>(null);
  const [activeIhyaBook, setActiveIhyaBook] = useState<BookItem | null>(null);
  const [activeChannel, setActiveChannel] = useState<ScholarChannel | null>(null);

  const quarters = ['All', 'Worship', 'Daily Life', 'Vices', 'Virtues'];

  // Filter Corpus Books (246 authenticated v4 & v5 masterworks)
  const filteredCorpus = useMemo(() => {
    return CLASSICAL_CORPUS.filter(book => {
      const matchesImam = selectedImam === 'all' || book.imam_key === selectedImam;
      const matchesVersion = selectedVersion === 'all' || book.version === selectedVersion;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        book.title.toLowerCase().includes(q) ||
        (book.arabic_title && book.arabic_title.includes(searchQuery.trim())) ||
        book.author.toLowerCase().includes(q) ||
        book.category.toLowerCase().includes(q) ||
        book.filename.toLowerCase().includes(q);
      return matchesImam && matchesVersion && matchesSearch;
    });
  }, [selectedImam, selectedVersion, searchQuery]);

  // Filter Ihya Books
  const filteredIhya = useMemo(() => {
    return IHYA_BOOKS.filter(b => {
      const matchesQuarter = selectedQuarter === 'All' || b.quarter === selectedQuarter;
      const matchesQuery =
        b.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.titleAr.includes(searchQuery);
      return matchesQuarter && matchesQuery;
    });
  }, [selectedQuarter, searchQuery]);

  // Filter Scholar Channels
  const filteredChannels = useMemo(() => {
    return SCHOLAR_CHANNELS.filter(c =>
      c.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nameAr.includes(searchQuery)
    );
  }, [searchQuery]);

  return (
    <View style={styles.container}>
      {/* Top Main Navigation Tabs */}
      <View style={styles.headerTabs}>
        <TouchableOpacity
          style={[styles.headerTabBtn, mainTab === 'corpus' && styles.headerTabBtnActive]}
          onPress={() => setMainTab('corpus')}
          activeOpacity={0.7}
        >
          <Text style={[styles.headerTabText, mainTab === 'corpus' && styles.headerTabTextActive]}>
            CORPUS v4/v5 ({CLASSICAL_CORPUS.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.headerTabBtn, mainTab === 'ihya' && styles.headerTabBtnActive]}
          onPress={() => setMainTab('ihya')}
          activeOpacity={0.7}
        >
          <Text style={[styles.headerTabText, mainTab === 'ihya' && styles.headerTabTextActive]}>
            IHYA 40 BOOKS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.headerTabBtn, mainTab === 'channels' && styles.headerTabBtnActive]}
          onPress={() => setMainTab('channels')}
          activeOpacity={0.7}
        >
          <Text style={[styles.headerTabText, mainTab === 'channels' && styles.headerTabTextActive]}>
            SCHOLARS
          </Text>
        </TouchableOpacity>
      </View>

      {/* Global Monospace Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, author, Arabic root or keyword..."
          placeholderTextColor="#4b5563"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: CORPUS v4/v5 (The 5 Classical Imams)                   */}
      {/* ------------------------------------------------------------- */}
      {mainTab === 'corpus' && (
        <View style={{ flex: 1 }}>
          {/* Imam Filter Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.chipScrollContent}
          >
            <TouchableOpacity
              style={[styles.chipBtn, selectedImam === 'all' && styles.chipBtnActive]}
              onPress={() => setSelectedImam('all')}
            >
              <Text style={[styles.chipText, selectedImam === 'all' && styles.chipTextActive]}>
                ALL IMAMS ({CLASSICAL_CORPUS.length})
              </Text>
            </TouchableOpacity>

            {IMAMS_METADATA.map(imam => (
              <TouchableOpacity
                key={imam.key}
                style={[styles.chipBtn, selectedImam === imam.key && styles.chipBtnActive]}
                onPress={() => setSelectedImam(imam.key)}
              >
                <Text style={[styles.chipText, selectedImam === imam.key && styles.chipTextActive]}>
                  {imam.key.toUpperCase()} ({imam.totalCount})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Version Filter Bar */}
          <View style={styles.versionBar}>
            <TouchableOpacity
              style={[styles.versionBtn, selectedVersion === 'all' && styles.versionBtnActive]}
              onPress={() => setSelectedVersion('all')}
            >
              <Text style={[styles.versionText, selectedVersion === 'all' && styles.versionTextActive]}>
                ALL EDITIONS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.versionBtn, selectedVersion === 'v5' && styles.versionBtnActive]}
              onPress={() => setSelectedVersion('v5')}
            >
              <Text style={[styles.versionText, selectedVersion === 'v5' && styles.versionTextActive]}>
                [v5] MASTERWORKS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.versionBtn, selectedVersion === 'v4' && styles.versionBtnActive]}
              onPress={() => setSelectedVersion('v4')}
            >
              <Text style={[styles.versionText, selectedVersion === 'v4' && styles.versionTextActive]}>
                [v4] BILINGUAL APPARATUS
              </Text>
            </TouchableOpacity>
          </View>

          {/* Books List View */}
          <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.resultCountLabel}>
              DISPLAYING {filteredCorpus.length} AUTHENTICATED CLASSICAL EPUBS:
            </Text>

            {filteredCorpus.map((book, idx) => {
              const isV5 = book.version === 'v5';
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.corpusCard, isV5 && styles.corpusCardV5]}
                  onPress={() => setActiveCorpusBook(book)}
                  activeOpacity={0.75}
                >
                  <View style={styles.corpusHeader}>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <View style={[styles.versionBadge, isV5 ? styles.badgeV5 : styles.badgeV4]}>
                        <Text style={[styles.versionBadgeText, isV5 ? styles.badgeTextV5 : styles.badgeTextV4]}>
                          {book.version.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.formatBadge}>
                        <Text style={styles.formatBadgeText}>
                          {book.edition_format ? book.edition_format.toUpperCase() : 'EPUB'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.sizeLabel}>{book.sizeMb}</Text>
                  </View>

                  {book.arabic_title ? (
                    <Text style={styles.corpusTitleAr} numberOfLines={1}>
                      {book.arabic_title}
                    </Text>
                  ) : null}

                  <Text style={styles.corpusTitleEn} numberOfLines={2}>
                    {book.title}
                  </Text>

                  <View style={styles.corpusFooter}>
                    <Text style={styles.corpusAuthor} numberOfLines={1}>
                      {book.author.split('(')[0].trim()}
                    </Text>
                    <Text style={styles.viewDetailsText}>{"[DETAILS >]"}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: IHYA 40 BOOKS (Imam Al-Ghazali)                         */}
      {/* ------------------------------------------------------------- */}
      {mainTab === 'ihya' && (
        <View style={{ flex: 1 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.chipScrollContent}
          >
            {quarters.map(q => (
              <TouchableOpacity
                key={q}
                style={[styles.chipBtn, selectedQuarter === q && styles.chipBtnActive]}
                onPress={() => setSelectedQuarter(q)}
              >
                <Text style={[styles.chipText, selectedQuarter === q && styles.chipTextActive]}>
                  {q.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
            {filteredIhya.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.bookCard}
                onPress={() => setActiveIhyaBook(item)}
                activeOpacity={0.75}
              >
                <View style={styles.bookCardHeader}>
                  <View style={styles.bookBadge}>
                    <Text style={styles.bookBadgeText}>BOOK #{item.id}</Text>
                  </View>
                  <Text style={styles.quarterBadge}>{item.quarterAr}</Text>
                </View>
                <Text style={styles.bookTitleAr}>{item.titleAr}</Text>
                <Text style={styles.bookTitleEn}>{item.titleEn}</Text>
                <Text style={styles.bookDesc} numberOfLines={2}>
                  {item.descEn}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: SCHOLAR CHANNELS                                       */}
      {/* ------------------------------------------------------------- */}
      {mainTab === 'channels' && (
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {filteredChannels.map(channel => (
            <TouchableOpacity
              key={channel.id}
              style={styles.channelCard}
              onPress={() => setActiveChannel(channel)}
              activeOpacity={0.75}
            >
              <Text style={styles.channelTitleAr}>{channel.nameAr}</Text>
              <Text style={styles.channelTitleEn}>{channel.nameEn}</Text>
              <Text style={styles.channelSubtitle}>{channel.titleEn}</Text>
              <Text style={styles.channelDesc}>{channel.descEn}</Text>

              <View style={styles.seriesContainer}>
                {channel.series.map((s, idx) => (
                  <View key={idx} style={styles.seriesRow}>
                    <Text style={styles.seriesTitle} numberOfLines={1}>
                      - {s.title}
                    </Text>
                    <Text style={styles.seriesCount}>[{s.count} PARTS]</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CORPUS BOOK DETAIL                                     */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={activeCorpusBook !== null}
        animationType="slide"
        onRequestClose={() => setActiveCorpusBook(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalBadge}>
                {activeCorpusBook?.version.toUpperCase()} MASTERWORK EDITION
              </Text>
              <Text style={styles.modalTitleAr} numberOfLines={1}>
                {activeCorpusBook?.arabic_title || activeCorpusBook?.title}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setActiveCorpusBook(null)}
            >
              <Text style={styles.closeBtnText}>[CLOSE]</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitleEn}>{activeCorpusBook?.title}</Text>
            <Text style={styles.modalSubtitle}>{activeCorpusBook?.author}</Text>

            <View style={styles.metadataGrid}>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>EDITION:</Text>
                <Text style={styles.metaVal}>{activeCorpusBook?.edition}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>CATEGORY:</Text>
                <Text style={styles.metaVal}>{activeCorpusBook?.category}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>FILE SIZE:</Text>
                <Text style={styles.metaVal}>{activeCorpusBook?.sizeMb}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>CHANNEL:</Text>
                <Text style={styles.metaVal}>#{activeCorpusBook?.channelId.replace('chan-', '')}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>DOWNLOAD URL:</Text>
                <Text style={[styles.metaVal, { color: '#00f59b' }]} numberOfLines={1}>
                  {activeCorpusBook?.downloadUrl}
                </Text>
              </View>
            </View>

            <View style={styles.sectionDivider} />

            <Text style={styles.sectionHeader}>SOVEREIGN L1 ANCHOR SPECIFICATION:</Text>
            <View style={styles.l1Box}>
              <Text style={styles.l1Code}>BLOCKCHAIN: Avalanche Subnet 51950</Text>
              <Text style={styles.l1Code}>SEAL: ZBAT_THAQB_L1_SEALED</Text>
              <Text style={styles.l1Code}>FORMAT: Authentic EPUB 3.0 / XHTML Strict</Text>
              <Text style={styles.l1Code}>VOCABULARY: AynEngine Epistemic Lexicon</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: IHYA BOOK DETAIL                                       */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={activeIhyaBook !== null}
        animationType="slide"
        onRequestClose={() => setActiveIhyaBook(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalBadge}>
                BOOK #{activeIhyaBook?.id} • {activeIhyaBook?.quarter.toUpperCase()}
              </Text>
              <Text style={styles.modalTitleAr}>{activeIhyaBook?.titleAr}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setActiveIhyaBook(null)}
            >
              <Text style={styles.closeBtnText}>[CLOSE]</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitleEn}>{activeIhyaBook?.titleEn}</Text>
            <Text style={styles.modalSubtitle}>Imam Abu Hamid al-Ghazali (d. 505 AH)</Text>
            <Text style={styles.modalDesc}>{activeIhyaBook?.descEn}</Text>

            <View style={styles.sectionDivider} />

            <Text style={styles.sectionHeader}>ARABIC MATN (ORIGINAL TEXT):</Text>
            <View style={styles.arabicBox}>
              <Text style={styles.arabicText}>{activeIhyaBook?.sampleContentAr}</Text>
            </View>

            <Text style={styles.sectionHeader}>SCHOLARLY ENGLISH TRANSLATION:</Text>
            <View style={styles.englishBox}>
              <Text style={styles.englishText}>{activeIhyaBook?.sampleContentEn}</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: SCHOLAR CHANNEL DETAIL                                 */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={activeChannel !== null}
        animationType="slide"
        onRequestClose={() => setActiveChannel(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalBadge}>SCHOLAR CHANNEL</Text>
              <Text style={styles.modalTitleAr}>{activeChannel?.nameAr}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setActiveChannel(null)}
            >
              <Text style={styles.closeBtnText}>[CLOSE]</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitleEn}>{activeChannel?.nameEn}</Text>
            <Text style={styles.modalSubtitle}>{activeChannel?.titleEn}</Text>
            <Text style={styles.modalDesc}>{activeChannel?.descEn}</Text>

            <View style={styles.sectionDivider} />

            <Text style={styles.sectionHeader}>LECTURE SERIES &amp; CURRICULA:</Text>
            {activeChannel?.series.map((s, idx) => (
              <View key={idx} style={styles.modalSeriesCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.modalSeriesTitle}>{s.title}</Text>
                  <Text style={styles.seriesCount}>[{s.count} PARTS]</Text>
                </View>
                <Text style={styles.modalSeriesDesc}>{s.desc}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090e',
  },
  headerTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 245, 155, 0.2)',
    backgroundColor: '#0d1117',
  },
  headerTabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  headerTabBtnActive: {
    borderBottomColor: '#00f59b',
    backgroundColor: 'rgba(0, 245, 155, 0.08)',
  },
  headerTabText: {
    color: '#8b949e',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTabTextActive: {
    color: '#00f59b',
  },
  searchContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },
  searchInput: {
    backgroundColor: '#161b22',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f0f6fc',
    fontSize: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipScroll: {
    maxHeight: 38,
    marginBottom: 4,
  },
  chipScrollContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  chipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipBtnActive: {
    backgroundColor: 'rgba(0, 245, 155, 0.15)',
    borderColor: '#00f59b',
  },
  chipText: {
    color: '#8b949e',
    fontSize: 10,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#00f59b',
  },
  versionBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
  },
  versionBtn: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  versionBtnActive: {
    backgroundColor: 'rgba(0, 245, 155, 0.15)',
    borderColor: '#00f59b',
  },
  versionText: {
    color: '#8b949e',
    fontSize: 9,
    fontWeight: '700',
  },
  versionTextActive: {
    color: '#00f59b',
  },
  resultCountLabel: {
    color: '#6e7681',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginVertical: 6,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  corpusCard: {
    backgroundColor: '#0d1117',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
  },
  corpusCardV5: {
    borderColor: 'rgba(0, 245, 155, 0.35)',
    backgroundColor: '#0f1620',
  },
  corpusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  versionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeV5: {
    backgroundColor: 'rgba(0, 245, 155, 0.2)',
    borderWidth: 1,
    borderColor: '#00f59b',
  },
  badgeV4: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  versionBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  badgeTextV5: {
    color: '#00f59b',
  },
  badgeTextV4: {
    color: '#38bdf8',
  },
  formatBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  formatBadgeText: {
    color: '#8b949e',
    fontSize: 8,
    fontWeight: '700',
  },
  sizeLabel: {
    color: '#6e7681',
    fontSize: 10,
    fontWeight: '600',
  },
  corpusTitleAr: {
    color: '#00f59b',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 4,
  },
  corpusTitleEn: {
    color: '#f0f6fc',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  corpusFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 6,
  },
  corpusAuthor: {
    color: '#8b949e',
    fontSize: 11,
    flex: 1,
  },
  viewDetailsText: {
    color: '#00f59b',
    fontSize: 10,
    fontWeight: '700',
  },
  bookCard: {
    backgroundColor: '#0d1117',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
  },
  bookCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bookBadge: {
    backgroundColor: 'rgba(0, 245, 155, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bookBadgeText: {
    color: '#00f59b',
    fontSize: 9,
    fontWeight: '800',
  },
  quarterBadge: {
    color: '#8b949e',
    fontSize: 10,
  },
  bookTitleAr: {
    color: '#00f59b',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 4,
  },
  bookTitleEn: {
    color: '#f0f6fc',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  bookDesc: {
    color: '#8b949e',
    fontSize: 11,
    lineHeight: 15,
  },
  channelCard: {
    backgroundColor: '#0d1117',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
  },
  channelTitleAr: {
    color: '#00f59b',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 2,
  },
  channelTitleEn: {
    color: '#f0f6fc',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  channelSubtitle: {
    color: '#00f59b',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 6,
  },
  channelDesc: {
    color: '#8b949e',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  seriesContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 6,
    padding: 8,
    gap: 4,
  },
  seriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seriesTitle: {
    color: '#e6edf3',
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
  },
  seriesCount: {
    color: '#00f59b',
    fontSize: 9,
    fontWeight: '800',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#07090e',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#0d1117',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalBadge: {
    color: '#00f59b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalTitleAr: {
    color: '#f0f6fc',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  closeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeBtnText: {
    color: '#f0f6fc',
    fontSize: 11,
    fontWeight: '800',
  },
  modalContent: {
    flex: 1,
    padding: 14,
  },
  modalTitleEn: {
    color: '#f0f6fc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: '#00f59b',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalDesc: {
    color: '#8b949e',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  metadataGrid: {
    backgroundColor: '#0d1117',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaKey: {
    color: '#6e7681',
    fontSize: 10,
    fontWeight: '700',
  },
  metaVal: {
    color: '#f0f6fc',
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 14,
  },
  sectionHeader: {
    color: '#00f59b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  l1Box: {
    backgroundColor: '#0d1117',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 155, 0.25)',
    gap: 4,
  },
  l1Code: {
    color: '#e6edf3',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  arabicBox: {
    backgroundColor: '#0d1117',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 155, 0.25)',
    marginBottom: 14,
  },
  arabicText: {
    color: '#f0f6fc',
    fontSize: 15,
    lineHeight: 26,
    textAlign: 'right',
  },
  englishBox: {
    backgroundColor: '#0d1117',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  englishText: {
    color: '#8b949e',
    fontSize: 12,
    lineHeight: 18,
  },
  modalSeriesCard: {
    backgroundColor: '#0d1117',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 6,
  },
  modalSeriesTitle: {
    color: '#f0f6fc',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  modalSeriesDesc: {
    color: '#8b949e',
    fontSize: 10,
    marginTop: 2,
  },
});
