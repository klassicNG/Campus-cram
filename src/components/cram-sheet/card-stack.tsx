import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CramCard } from '../../constants/cram-types';
import { SwipeableCard } from './swipeable-card';
import { SessionSummary } from './session-summary';

interface CardStackProps {
  cards: CramCard[];
  currentIndex: number;
  totalDeckCards: number;
  deckTitle: string;
  courseCode: string;
  memorizedCards: CramCard[];
  reviewCards: CramCard[];
  isSessionComplete: boolean;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onRestartDeck: () => void;
  onRecramReviewCards: () => void;
  onChangeDeck: () => void;
}

export function CardStack({
  cards,
  currentIndex,
  totalDeckCards,
  deckTitle,
  courseCode,
  memorizedCards,
  reviewCards,
  isSessionComplete,
  onSwipeRight,
  onSwipeLeft,
  onRestartDeck,
  onRecramReviewCards,
  onChangeDeck,
}: CardStackProps) {
  if (isSessionComplete || currentIndex >= cards.length) {
    return (
      <SessionSummary
        totalCards={totalDeckCards}
        memorizedCards={memorizedCards}
        reviewCards={reviewCards}
        deckTitle={deckTitle}
        courseCode={courseCode}
        onRestartDeck={onRestartDeck}
        onRecramReviewCards={onRecramReviewCards}
        onChangeDeck={onChangeDeck}
      />
    );
  }

  const currentCard = cards[currentIndex];
  const nextCard = currentIndex + 1 < cards.length ? cards[currentIndex + 1] : null;

  return (
    <View style={styles.stackContainer}>
      {/* Tactile deck stack edge behind the active card */}
      {nextCard && (
        <View
          style={[styles.cardAbsolute, styles.underneathCard]}
          pointerEvents="none"
        >
          <View style={styles.deckStackEdge} />
        </View>
      )}

      {/* Foreground active card - key ensures fresh instance on each question */}
      <View style={styles.cardAbsolute}>
        <SwipeableCard
          key={currentCard.id}
          card={currentCard}
          onSwipeRight={onSwipeRight}
          onSwipeLeft={onSwipeLeft}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stackContainer: {
    width: '100%',
    height: 480,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  underneathCard: {
    transform: [{ scale: 0.95 }, { translateY: 10 }],
    opacity: 0.8,
  },
  deckStackEdge: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
});
