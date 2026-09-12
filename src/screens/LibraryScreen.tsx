/**
 * LibraryScreen.tsx - WyreNet Sovereign Library & Imam Channels
 * المَكْتَبَة الإِسْلَامِيَّة وقَنَوَات العُلَمَاء
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { IHYA_BOOKS, SCHOLAR_CHANNELS, BookItem, ScholarChannel } from '../content/libraryData';

export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<'books' | 'channels'>('books');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeBook, setActiveBook] = useState<BookItem | null>(null);
  const [activeChannel, setActiveChannel] = useState<ScholarChannel | null>(null);

  const quarters = ['All', 'Worship', 'Daily Life', 'Vices', 'Virtues'];

  const filteredBooks = IHYA_BOOKS.filter(b => {
    const matchesQuarter = selectedQuarter === 'All' || b.quarter === selectedQuarter;
    const matchesQuery = b.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         b.titleAr.includes(searchQuery);
    return matchesQuarter && matchesQuery;
  });

  const filteredChannels = SCHOLAR_CHANNELS.filter(c => 
    c.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.nameAr.includes(searchQuery)
  );

  return (
    <View style={styles.container}>
      {/* Top Header Selector */}
      <View style={styles.headerTabs}>
        <TouchableOpacity
          style={[styles.headerTabBtn, activeTab === 'books' && styles.headerTabBtnActive]}
          onPress={() => setActiveTab('books')}
        >
          <Text style={[styles.headerTabText, activeTab === 'books' && styles.headerTabTextActive]}>
            [BOOKS] 40 IHYA VOLUMES
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.headerTabBtn, activeTab === 'channels' && styles.headerTabBtnActive]}
          onPress={() => setActiveTab('channels')}
        >
          <Text style={[styles.headerTabText, activeTab === 'channels' && styles.headerTabTextActive]}>
            [CHANNELS] SCHOLARS & DARAS
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search books, scholars, topics..."
          placeholderTextColor="#8492A6"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Quarter Filter Chips (Books Tab Only) */}
      {activeTab === 'books' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quarterScroll}>
          {quarters.map(q => (
            <TouchableOpacity
              key={q}
              style={[styles.quarterChip, selectedQuarter === q && styles.quarterChipActive]}
              onPress={() => setSelectedQuarter(q)}
            >
              <Text style={[styles.quarterChipText, selectedQuarter === q && styles.quarterChipTextActive]}>
                {q.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Main List */}
      <ScrollView style={styles.listContainer}>
        {activeTab === 'books' ? (
          filteredBooks.map(book => (
            <TouchableOpacity
              key={book.id}
              style={styles.bookCard}
              onPress={() => setActiveBook(book)}
            >
              <View style={styles.bookCardHeader}>
                <View style={styles.bookBadge}>
                  <Text style={styles.bookBadgeText}>BOOK #{book.id}</Text>
                </View>
                <Text style={styles.quarterBadge}>{book.quarterAr}</Text>
              </View>

              <Text style={styles.bookTitleAr}>{book.titleAr}</Text>
              <Text style={styles.bookTitleEn}>{book.titleEn}</Text>
              <Text style={styles.bookDesc} numberOfLines={2}>{book.descEn}</Text>
            </TouchableOpacity>
          ))
        ) : (
          filteredChannels.map(channel => (
            <TouchableOpacity
              key={channel.id}
              style={styles.channelCard}
              onPress={() => setActiveChannel(channel)}
            >
              <Text style={styles.channelTitleAr}>{channel.nameAr}</Text>
              <Text style={styles.channelTitleEn}>{channel.nameEn}</Text>
              <Text style={styles.channelSubtitle}>{channel.titleEn}</Text>
              <Text style={styles.channelDesc} numberOfLines={2}>{channel.descEn}</Text>

              <View style={styles.seriesContainer}>
                {channel.series.map((s, idx) => (
                  <View key={idx} style={styles.seriesRow}>
                    <Text style={styles.seriesTitle}>{s.title}</Text>
                    <Text style={styles.seriesCount}>[{s.count} LESSONS]</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Book Reader Modal */}
      <Modal
        visible={!!activeBook}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setActiveBook(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalBadge}>BOOK #{activeBook?.id} • {activeBook?.quarterAr}</Text>
              <Text style={styles.modalTitleAr}>{activeBook?.titleAr}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setActiveBook(null)}
            >
              <Text style={styles.closeBtnText}>[CLOSE]</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitleEn}>{activeBook?.titleEn}</Text>
            <Text style={styles.modalDesc}>{activeBook?.descEn}</Text>

            <View style={styles.sectionDivider} />

            <Text style={styles.sectionHeader}>ARABIC TEXT (النَّصّ العَرَبِيّ الأصِيل):</Text>
            <View style={styles.arabicBox}>
              <Text style={styles.arabicText}>{activeBook?.sampleContentAr}</Text>
            </View>

            <Text style={styles.sectionHeader}>ENGLISH TRANSLATION & COMMENTARY:</Text>
            <View style={styles.englishBox}>
              <Text style={styles.englishText}>{activeBook?.sampleContentEn}</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Channel Modal */}
      <Modal
        visible={!!activeChannel}
        animationType="slide"
        transparent={false}
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

            <Text style={styles.sectionHeader}>LECTURE SERIES & CURRICULA:</Text>
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
    backgroundColor: '#050B07',
  },
  headerTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 102, 0.2)',
    backgroundColor: 'rgba(8, 18, 12, 0.95)',
  },
  headerTabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  headerTabBtnActive: {
    borderBottomColor: '#00FF66',
    backgroundColor: 'rgba(0, 255, 102, 0.08)',
  },
  headerTabText: {
    color: '#8492A6',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  headerTabTextActive: {
    color: '#00FF66',
  },
  searchContainer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 102, 0.2)',
    fontFamily: 'monospace',
  },
  quarterScroll: {
    maxHeight: 40,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  quarterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  quarterChipActive: {
    backgroundColor: '#00FF66',
    borderColor: '#00FF66',
  },
  quarterChipText: {
    color: '#8492A6',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  quarterChipTextActive: {
    color: '#000000',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  bookCard: {
    backgroundColor: 'rgba(10, 24, 16, 0.85)',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 102, 0.2)',
    marginBottom: 10,
  },
  bookCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bookBadge: {
    backgroundColor: 'rgba(0, 255, 102, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 102, 0.3)',
  },
  bookBadgeText: {
    color: '#00FF66',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  quarterBadge: {
    color: '#8492A6',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  bookTitleAr: {
    color: '#00FF66',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 4,
  },
  bookTitleEn: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  bookDesc: {
    color: '#8492A6',
    fontSize: 12,
    lineHeight: 16,
  },
  channelCard: {
    backgroundColor: 'rgba(10, 24, 16, 0.85)',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 102, 0.2)',
    marginBottom: 10,
  },
  channelTitleAr: {
    color: '#00FF66',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 2,
  },
  channelTitleEn: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  channelSubtitle: {
    color: '#00FF66',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  channelDesc: {
    color: '#8492A6',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  seriesContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  seriesCount: {
    color: '#00FF66',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#050B07',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(8, 18, 12, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 102, 0.2)',
  },
  modalBadge: {
    color: '#8492A6',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  modalTitleAr: {
    color: '#00FF66',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  closeBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalTitleEn: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: '#00FF66',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  modalDesc: {
    color: '#8492A6',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 255, 102, 0.2)',
    marginVertical: 14,
  },
  sectionHeader: {
    color: '#00FF66',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  arabicBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 102, 0.3)',
    marginBottom: 16,
  },
  arabicText: {
    color: '#FFF',
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'right',
  },
  englishBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
  },
  englishText: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 20,
  },
  modalSeriesCard: {
    backgroundColor: 'rgba(10, 24, 16, 0.85)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 102, 0.2)',
    marginBottom: 8,
  },
  modalSeriesTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  modalSeriesDesc: {
    color: '#8492A6',
    fontSize: 11,
    marginTop: 4,
  },
});
