import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  Trophy,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';
import { CramCard } from '../../constants/cram-types';

interface SessionSummaryProps {
  totalCards: number;
  memorizedCards: CramCard[];
  reviewCards: CramCard[];
  deckTitle: string;
  courseCode: string;
  onRestartDeck: () => void;
  onRecramReviewCards: () => void;
  onChangeDeck: () => void;
}

export function SessionSummary({
  totalCards,
  memorizedCards,
  reviewCards,
  deckTitle,
  courseCode,
  onRestartDeck,
  onRecramReviewCards,
  onChangeDeck,
}: SessionSummaryProps) {
  const retentionPercentage = Math.round(
    (memorizedCards.length / (totalCards || 1)) * 100
  );

  return (
    <View className="bg-white rounded-3xl p-6 border border-black/5 shadow-lg my-2">
      {/* Trophy Badge */}
      <View className="items-center mb-5">
        <View className="w-16 h-16 rounded-full bg-[#ffa200]/15 border border-[#ffa200]/30 items-center justify-center mb-3">
          <Trophy size={30} color="#ff6a00" strokeWidth={2.2} />
        </View>
        <Text className="text-2xl font-bold text-[#0f1c24] tracking-tight">
          Cram Session Complete!
        </Text>
        <Text className="text-xs text-[#64748b] text-center mt-1">
          {courseCode} • {deckTitle}
        </Text>
      </View>

      {/* Retention Rate Stat Card */}
      <View className="bg-[#001524] rounded-2xl p-5 mb-5 flex-row items-center justify-between shadow-md">
        <View>
          <Text className="text-[10px] font-bold text-[#ffa200] uppercase tracking-wider mb-1">
            Retention Mastery
          </Text>
          <Text className="text-4xl font-extrabold text-white">
            {retentionPercentage}%
          </Text>
          <Text className="text-xs text-white/70 mt-1">
            {memorizedCards.length} of {totalCards} concepts locked in
          </Text>
        </View>

        <View className="items-end gap-2">
          <View className="flex-row items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full">
            <CheckCircle2 size={12} color="#10b981" />
            <Text className="text-xs font-bold text-emerald-400">
              {memorizedCards.length} Memorized
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5 bg-rose-500/20 border border-rose-500/30 px-3 py-1 rounded-full">
            <AlertCircle size={12} color="#f43f5e" />
            <Text className="text-xs font-bold text-rose-300">
              {reviewCards.length} Need Review
            </Text>
          </View>
        </View>
      </View>

      {/* Review List (if any cards flagged for review) */}
      {reviewCards.length > 0 && (
        <View className="mb-6">
          <Text className="text-xs font-bold text-[#334155] uppercase tracking-wider mb-2.5">
            Concepts to Reinforce
          </Text>
          <View className="gap-2">
            {reviewCards.map((c) => (
              <View
                key={c.id}
                className="bg-[#f8fafc] border border-gray-200/80 rounded-xl p-3 flex-row items-center justify-between"
              >
                <View className="flex-1 pr-2">
                  <Text className="text-xs font-bold text-[#1e293b]">
                    {c.concept}
                  </Text>
                  <Text className="text-[10px] text-[#64748b] mt-0.5">
                    💡 Mnemonic: {c.mnemonic.hook}
                  </Text>
                </View>
                <View className="bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                  <Text className="text-[9px] font-bold text-rose-700 uppercase">
                    Review
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View className="gap-2.5">
        {reviewCards.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onRecramReviewCards}
            className="w-full bg-[#001524] py-3.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
          >
            <RotateCcw size={15} color="#ffa200" />
            <Text className="text-xs font-bold text-white tracking-wide">
              Re-Cram {reviewCards.length} Flagged Cards
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onRestartDeck}
          className="w-full bg-gray-100 border border-gray-200 py-3.5 px-4 rounded-xl flex-row items-center justify-center gap-2"
        >
          <Sparkles size={15} color="#003c66" />
          <Text className="text-xs font-bold text-[#003c66]">
            Restart Full Deck
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onChangeDeck}
          className="w-full bg-white border border-gray-200 py-3 px-4 rounded-xl flex-row items-center justify-center gap-2"
        >
          <BookOpen size={14} color="#64748b" />
          <Text className="text-xs font-semibold text-[#64748b]">
            Switch Course Deck
          </Text>
          <ArrowRight size={13} color="#64748b" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
