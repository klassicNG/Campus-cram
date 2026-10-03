import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  X,
  Layers,
  Clock,
  ChevronRight,
  Upload,
} from 'lucide-react-native';
import { CramDeck } from '../../constants/cram-types';

interface DeckModalProps {
  visible: boolean;
  decks: CramDeck[];
  selectedDeckId: string;
  onSelectDeck: (deck: CramDeck) => void;
  onClose: () => void;
  onOpenUploadPrompt?: () => void;
}

export function DeckModal({
  visible,
  decks,
  selectedDeckId,
  onSelectDeck,
  onClose,
  onOpenUploadPrompt,
}: DeckModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View className="flex-row items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-[#ffa200]/20 items-center justify-center border border-[#ffa200]/30">
                <Layers size={16} color="#ff6a00" />
              </View>
              <View>
                <Text className="text-base font-bold text-[#0f1c24]">
                  Select Cram Deck
                </Text>
                <Text className="text-[11px] text-[#64748b]">
                  Choose course material for active recall
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
            >
              <X size={16} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Decks List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <Text className="text-[10px] font-bold uppercase tracking-wider text-[#8995a9] mb-2 px-1">
              Curated Course Decks
            </Text>

            <View className="gap-2.5 mb-6">
              {decks.map((deck) => {
                const isSelected = deck.id === selectedDeckId;
                return (
                  <TouchableOpacity
                    key={deck.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      onSelectDeck(deck);
                      onClose();
                    }}
                    className={`rounded-2xl p-4 border ${
                      isSelected
                        ? 'bg-[#001524] border-[#001524] shadow-md'
                        : 'bg-white border-gray-200/90'
                    }`}
                  >
                    <View className="flex-row items-center justify-between mb-1.5">
                      <View className="flex-row items-center gap-2">
                        <View
                          className={`px-2 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-[#ffa200]/30 border border-[#ffa200]/40'
                              : 'bg-gray-100'
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-bold ${
                              isSelected ? 'text-[#ffa200]' : 'text-[#003c66]'
                            }`}
                          >
                            {deck.courseCode}
                          </Text>
                        </View>
                        <Text
                          className={`text-xs font-semibold ${
                            isSelected ? 'text-white/80' : 'text-[#64748b]'
                          }`}
                        >
                          {deck.category}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-1">
                        <Clock
                          size={11}
                          color={isSelected ? '#94a3b8' : '#64748b'}
                        />
                        <Text
                          className={`text-[10px] ${
                            isSelected ? 'text-[#94a3b8]' : 'text-[#64748b]'
                          }`}
                        >
                          ~{deck.estimatedMinutes}m
                        </Text>
                      </View>
                    </View>

                    <Text
                      className={`text-sm font-bold mb-1 ${
                        isSelected ? 'text-white' : 'text-[#0f1c24]'
                      }`}
                    >
                      {deck.title}
                    </Text>

                    <Text
                      numberOfLines={2}
                      className={`text-xs leading-4 mb-3 ${
                        isSelected ? 'text-white/70' : 'text-[#64748b]'
                      }`}
                    >
                      {deck.description}
                    </Text>

                    <View className="flex-row items-center justify-between pt-2 border-t border-white/10">
                      <Text
                        className={`text-[11px] font-medium ${
                          isSelected ? 'text-[#ffa200]' : 'text-[#003c66]'
                        }`}
                      >
                        {deck.cardCount} Mnemonic Cards
                      </Text>

                      <View className="flex-row items-center gap-0.5">
                        <Text
                          className={`text-[11px] font-semibold ${
                            isSelected ? 'text-white' : 'text-[#003c66]'
                          }`}
                        >
                          {isSelected ? 'Active Deck' : 'Start Cram'}
                        </Text>
                        <ChevronRight
                          size={13}
                          color={isSelected ? '#ffffff' : '#003c66'}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Notes / PDF Generation CTA banner */}
            {onOpenUploadPrompt && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  onClose();
                  onOpenUploadPrompt();
                }}
                className="rounded-2xl p-4 bg-gradient-to-r bg-[#f8fafc] border border-dashed border-gray-300 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-xl bg-[#001524] items-center justify-center">
                    <Upload size={18} color="#ffa200" />
                  </View>
                  <View>
                    <Text className="text-xs font-bold text-[#0f1c24]">
                      Generate from Your Material
                    </Text>
                    <Text className="text-[10px] text-[#64748b]">
                      AI builds mnemonic flashcards from PDF or notes
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#64748b" />
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '82%',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
});
