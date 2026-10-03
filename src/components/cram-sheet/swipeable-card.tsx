import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Dimensions,
  StyleSheet,
  ScrollView,
  Animated,
  PanResponder,
} from 'react-native';
import {
  Bookmark,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  RotateCw,
  Code2,
  CheckCircle2,
  XCircle,
  Target,
  BookOpen,
} from 'lucide-react-native';
import { CramCard } from '../../constants/cram-types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;

interface SwipeableCardProps {
  card: CramCard;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
}

export function SwipeableCard({ card, onSwipeRight, onSwipeLeft }: SwipeableCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const lastFlipTime = useRef(0);
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const toggleFlip = () => {
    const now = Date.now();
    if (now - lastFlipTime.current < 250) return;
    lastFlipTime.current = now;
    setIsFlipped((prev) => !prev);
  };

  // PanResponder for finger swiping
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture horizontal swipes so vertical scroll inside the card works smoothly
        return (
          Math.abs(gestureState.dx) > 12 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
        );
      },
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy * 0.15 });
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldRight =
          gestureState.dx > SWIPE_THRESHOLD || gestureState.vx > 0.6;
        const shouldLeft =
          gestureState.dx < -SWIPE_THRESHOLD || gestureState.vx < -0.6;

        if (shouldRight) {
          onSwipeRight();
        } else if (shouldLeft) {
          onSwipeLeft();
        } else {
          // Return smoothly to center
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 7,
            tension: 40,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // Visual drag transformations
  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-14deg', '0deg', '14deg'],
    extrapolate: 'clamp',
  });

  const memorizedStampOpacity = pan.x.interpolate({
    inputRange: [15, SWIPE_THRESHOLD * 0.75],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const reviewStampOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD * 0.75, -15],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const animatedCardStyle = {
    transform: [
      { translateX: pan.x },
      { translateY: pan.y },
      { rotate },
    ],
  };

  return (
    <View style={styles.cardWrapper} {...panResponder.panHandlers}>
      <Animated.View style={[styles.cardContainer, animatedCardStyle]}>
        {/* Stamp: MEMORIZED (Right) */}
        <Animated.View
          style={[
            styles.stampPill,
            styles.memorizedStamp,
            { opacity: memorizedStampOpacity },
          ]}
          pointerEvents="none"
        >
          <CheckCircle2 size={17} color="#10b981" strokeWidth={2.5} />
          <Text style={styles.memorizedText}>MEMORIZED</Text>
        </Animated.View>

        {/* Stamp: REVIEW AGAIN (Left) */}
        <Animated.View
          style={[
            styles.stampPill,
            styles.reviewStamp,
            { opacity: reviewStampOpacity },
          ]}
          pointerEvents="none"
        >
          <XCircle size={17} color="#ef4444" strokeWidth={2.5} />
          <Text style={styles.reviewText}>REVIEW AGAIN</Text>
        </Animated.View>

        {/* Card Front Face */}
        {!isFlipped && (
          <Pressable onPress={toggleFlip} style={styles.cardSurface}>
            {/* Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100 mb-3" pointerEvents="none">
              <View className="flex-row items-center gap-2">
                <View className="w-7 h-7 rounded-lg bg-[#001524]/5 items-center justify-center">
                  <Bookmark size={14} color="#003c66" />
                </View>
                <Text className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8995a9]">
                  {card.topic}
                </Text>
              </View>
              <View className="rounded-full bg-[#ffa200]/15 px-2.5 py-1 border border-[#ffa200]/20">
                <Text className="text-[9px] font-bold text-[#ff6a00] uppercase tracking-wide">
                  {card.difficulty}
                </Text>
              </View>
            </View>

            {/* Content Body */}
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            >
              <Pressable onPress={toggleFlip} style={{ flexGrow: 1 }}>
                <Text className="text-2xl font-bold text-[#0f1c24] mb-3 tracking-tight">
                  {card.concept}
                </Text>

                <View className="bg-[#f7f9fa] rounded-2xl p-4 border border-gray-200/70 my-2">
                  <View className="flex-row items-center gap-1.5 mb-2">
                    <Target size={14} color="#003c66" />
                    <Text className="text-[11px] font-bold text-[#003c66] uppercase tracking-wider">
                      Test Yourself
                    </Text>
                  </View>
                  <Text className="text-sm font-semibold text-[#1e293b] leading-6">
                    {card.recallPrompt}
                  </Text>
                </View>

                <View className="bg-white rounded-xl p-3 border border-gray-200/60 mt-3">
                  <Text className="text-[11px] text-[#64748b] leading-5">
                    💡 Try to articulate the answer in your head before flipping.
                  </Text>
                </View>
              </Pressable>
            </ScrollView>

            {/* Bottom Flip Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={toggleFlip}
              className="mt-3 w-full py-3.5 px-4 rounded-xl bg-[#001524] flex-row items-center justify-center gap-2 shadow-sm"
            >
              <RotateCw size={14} color="#ffa200" />
              <Text className="text-xs font-bold text-white tracking-wide">
                Tap to Flip Card
              </Text>
            </TouchableOpacity>
          </Pressable>
        )}

        {/* Card Back Face (Answer & Memory Anchor) */}
        {isFlipped && (
          <Pressable onPress={toggleFlip} style={styles.cardSurface}>
            {/* Header */}
            <View className="flex-row items-center justify-between pb-2 border-b border-gray-100 mb-2" pointerEvents="none">
              <View className="flex-row items-center gap-1.5">
                <BookOpen size={14} color="#003c66" />
                <Text className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#003c66]">
                  Answer & Concept
                </Text>
              </View>
              <View className="rounded-full bg-[#ffa200]/15 px-2.5 py-1 border border-[#ffa200]/20">
                <Text className="text-[9px] font-bold text-[#ff6a00] uppercase tracking-wide">
                  {card.difficulty}
                </Text>
              </View>
            </View>

            {/* Back Scrollable Content */}
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 4, paddingBottom: 12, flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            >
              <Pressable onPress={toggleFlip} style={{ flexGrow: 1 }}>
                <Text className="text-xl font-bold text-[#0f1c24] mb-2 tracking-tight">
                  {card.concept}
                </Text>

                {/* Memory Anchor Box */}
                <View className="bg-[#fff9eb] border border-[#ffa200]/30 rounded-2xl p-3.5 mb-3 shadow-xs">
                  <View className="flex-row items-center gap-1.5 mb-1.5">
                    <Lightbulb size={14} color="#ff6a00" />
                    <Text className="text-[11px] font-bold text-[#ff6a00] uppercase tracking-wider">
                      Memory Anchor
                    </Text>
                  </View>
                  <Text className="text-sm font-bold text-[#0f1c24] mb-1">
                    {card.mnemonic.hook}
                  </Text>
                  <Text className="text-xs text-[#713f12] leading-5 font-medium">
                    {card.mnemonic.explanation}
                  </Text>
                </View>

                {/* Plain English Summary */}
                <View className="bg-[#f0f9ff] border border-[#0095ff]/20 rounded-xl p-3 mb-3">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <Sparkles size={12} color="#0077cc" />
                    <Text className="text-[10px] font-bold text-[#0077cc] uppercase tracking-wider">
                      Core Concept
                    </Text>
                  </View>
                  <Text className="text-xs text-[#0c4a6e] font-medium leading-5">
                    {card.plainIntuition}
                  </Text>
                </View>

                {/* Key Principles */}
                <View className="my-1">
                  <Text className="text-[11px] font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                    Key Principles
                  </Text>
                  <View className="gap-2">
                    {card.breakdown.map((point, index) => (
                      <Text
                        key={index}
                        className="text-xs text-[#475569] leading-5 font-normal"
                      >
                        {point}
                      </Text>
                    ))}
                  </View>
                </View>

                {/* Formula or Code Snippet */}
                {card.formulaOrCode && (
                  <View className="bg-[#1e293b] rounded-xl p-3 my-2.5 border border-slate-700">
                    <View className="flex-row items-center gap-1.5 mb-1.5">
                      <Code2 size={12} color="#38bdf8" />
                      <Text className="text-[9px] font-bold text-[#38bdf8] uppercase tracking-wider">
                        Formula / Pattern
                      </Text>
                    </View>
                    <Text className="text-[11px] font-mono text-emerald-400 leading-4">
                      {card.formulaOrCode}
                    </Text>
                  </View>
                )}

                {/* Common Exam Trap */}
                <View className="bg-[#fef2f2] border border-[#ef4444]/25 rounded-xl p-3 mt-2">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <AlertTriangle size={12} color="#dc2626" />
                    <Text className="text-[10px] font-bold text-[#dc2626] uppercase tracking-wider">
                      Common Exam Trap
                    </Text>
                  </View>
                  <Text className="text-xs text-[#991b1b] font-medium leading-5">
                    {card.examTrap}
                  </Text>
                </View>
              </Pressable>
            </ScrollView>

            {/* Bottom Flip Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={toggleFlip}
              className="mt-2 w-full py-3 px-4 rounded-xl bg-gray-100 border border-gray-200 flex-row items-center justify-center gap-2"
            >
              <RotateCw size={13} color="#475569" />
              <Text className="text-xs font-semibold text-[#475569]">
                Tap to Flip Front
              </Text>
            </TouchableOpacity>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    height: 480,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cardSurface: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
    overflow: 'hidden',
  },
  stampPill: {
    position: 'absolute',
    top: 24,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  memorizedStamp: {
    right: 18,
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
    transform: [{ rotate: '12deg' }],
  },
  memorizedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 1,
  },
  reviewStamp: {
    left: 18,
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    transform: [{ rotate: '-12deg' }],
  },
  reviewText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#dc2626',
    letterSpacing: 1,
  },
});
