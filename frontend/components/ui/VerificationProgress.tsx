import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface ProgressStep {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

interface VerificationProgressProps {
  steps: ProgressStep[];
  currentStep: number;
  progress: number; // 0-100
  isLoading?: boolean;
}

export function VerificationProgress({ 
  steps, 
  currentStep, 
  progress, 
  isLoading = false 
}: VerificationProgressProps) {
  const { colors } = useTheme();

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#00C851';
      case 'processing':
        return '#2196F3';
      case 'error':
        return '#FF4444';
      default:
        return colors.text + '40';
    }
  };

  const getStepIcon = (step: ProgressStep, index: number) => {
    if (step.status === 'completed') {
      return 'checkmark-circle';
    } else if (step.status === 'error') {
      return 'close-circle';
    } else if (step.status === 'processing') {
      return 'sync';
    } else {
      return step.icon;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Overall Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressTitle, { color: colors.text }]}>
            Verification Progress
          </Text>
          <Text style={[styles.progressPercentage, { color: colors.text }]}>
            {Math.round(progress)}%
          </Text>
        </View>
        
        <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
          <Animated.View 
            style={[
              styles.progressBar,
              { 
                width: `${progress}%`,
                backgroundColor: '#2196F3'
              }
            ]}
          />
        </View>
      </View>

      {/* Steps */}
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepItem}>
            {/* Step Line */}
            {index > 0 && (
              <View style={[
                styles.stepLine,
                { 
                  backgroundColor: index <= currentStep 
                    ? getStepColor(steps[index - 1].status)
                    : colors.border
                }
              ]} />
            )}
            
            {/* Step Content */}
            <View style={styles.stepContent}>
              <View style={[
                styles.stepIcon,
                { 
                  backgroundColor: getStepColor(step.status),
                  borderColor: getStepColor(step.status)
                }
              ]}>
                <Ionicons 
                  name={getStepIcon(step, index)}
                  size={16} 
                  color="white"
                  style={step.status === 'processing' ? styles.spinning : undefined}
                />
              </View>
              
              <View style={styles.stepText}>
                <Text style={[
                  styles.stepTitle,
                  { 
                    color: index <= currentStep ? colors.text : colors.text + '60',
                    fontWeight: index === currentStep ? 'bold' : '500'
                  }
                ]}>
                  {step.title}
                </Text>
                <Text style={[
                  styles.stepSubtitle,
                  { 
                    color: index <= currentStep ? colors.text + '80' : colors.text + '40'
                  }
                ]}>
                  {step.subtitle}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingDots}>
            <View style={[styles.loadingDot, styles.loadingDot1, { backgroundColor: colors.primary }]} />
            <View style={[styles.loadingDot, styles.loadingDot2, { backgroundColor: colors.primary }]} />
            <View style={[styles.loadingDot, styles.loadingDot3, { backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Analyzing and verifying...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  stepsContainer: {
    marginTop: 8,
  },
  stepItem: {
    marginBottom: 16,
    position: 'relative',
  },
  stepLine: {
    position: 'absolute',
    left: 12,
    top: -16,
    width: 2,
    height: 16,
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    paddingTop: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  stepSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  spinning: {
    // Animation would be implemented with Animated API
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  loadingDot1: {
    // Animation keyframes would be applied here
  },
  loadingDot2: {
    // Animation delay would be applied here
  },
  loadingDot3: {
    // Animation delay would be applied here  
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

// Default progress steps for fact-checking
export const defaultFactCheckSteps: ProgressStep[] = [
  {
    id: '1',
    title: 'Analyzing Content',
    subtitle: 'Processing and understanding the input text',
    icon: 'document-text',
    status: 'pending'
  },
  {
    id: '2',
    title: 'Extracting Claims',
    subtitle: 'Identifying verifiable statements and claims',
    icon: 'list',
    status: 'pending'
  },
  {
    id: '3',
    title: 'Searching Sources',
    subtitle: 'Finding reliable sources and references',
    icon: 'search',
    status: 'pending'
  },
  {
    id: '4',
    title: 'Cross-referencing',
    subtitle: 'Comparing claims with verified information',
    icon: 'git-compare',
    status: 'pending'
  },
  {
    id: '5',
    title: 'Generating Results',
    subtitle: 'Compiling verification results and verdict',
    icon: 'checkmark-done',
    status: 'pending'
  }
];