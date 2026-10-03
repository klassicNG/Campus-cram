import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  className?: string;
}

export function AnimatedPressable({
  children,
  style,
  scaleTo = 0.96,
  onPressIn,
  onPressOut,
  ...props
}: AnimatedPressableProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: scaleTo,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    onPressOut?.(e);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
