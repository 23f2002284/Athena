import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Using dynamic import to handle ESM/CJS interop
const useTheme = () => ({
  colors: {
    background: '#ffffff',
    text: '#000000',
    border: '#e0e0e0'
  }
});

interface Source {
  id: string;
  title: string;
  url: string;
  domain: string;
  isReliable: boolean;
}

interface VerdictData {
  status: 'supported' | 'refuted' | 'insufficient' | 'conflicting';
  percentage: number;
  color: string;
}

interface VerificationResult {
  claim: string;
  verdict: VerdictData;
  sources: Source[];
  processedAnswer: string;
  summary: {
    supported: number;
    refuted: number;
    insufficient: number;
    conflicting: number;
  };
  claimsAnalyzed: number;
}

interface VerificationResultsProps {
  result: VerificationResult;
  onClose?: () => void;
}

export function VerificationResults({ result, onClose }: VerificationResultsProps) {
  const { colors } = useTheme();

  const handleSourcePress = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const VerdictIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'supported':
        return <Ionicons name="checkmark-circle" size={24} color="#00C851" />;
      case 'refuted':
        return <Ionicons name="close-circle" size={24} color="#FF4444" />;
      case 'insufficient':
        return <Ionicons name="help-circle" size={24} color="#9C27B0" />;
      case 'conflicting':
        return <Ionicons name="warning" size={24} color="#2196F3" />;
      default:
        return <Ionicons name="help-circle" size={24} color="#666" />;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Verification Results</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Verification Status */}
      <View style={[styles.section, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Verification</Text>
        
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <View style={[styles.statusBadge, { backgroundColor: '#E8F5E8' }]}>
              <Text style={[styles.statusText, { color: '#00C851' }]}>Contextual</Text>
              <Text style={styles.statusNumber}>0</Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusBadge, { backgroundColor: '#FFF3E0' }]}>
              <Text style={[styles.statusText, { color: '#FF9800' }]}>Selected</Text>
              <Text style={styles.statusNumber}>0</Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusBadge, { backgroundColor: '#F3E5F5' }]}>
              <Text style={[styles.statusText, { color: '#9C27B0' }]}>Disambiguated</Text>
              <Text style={styles.statusNumber}>0</Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusBadge, { backgroundColor: '#E3F2FD' }]}>
              <Text style={[styles.statusText, { color: '#2196F3' }]}>Claims</Text>
              <Text style={styles.statusNumber}>0</Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusBadge, { backgroundColor: '#E8F5E8' }]}>
              <Text style={[styles.statusText, { color: '#4CAF50' }]}>Validated</Text>
              <Text style={styles.statusNumber}>1</Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusBadge, { backgroundColor: '#FFF3E0' }]}>
              <Text style={[styles.statusText, { color: '#FF6B35' }]}>Verdict</Text>
              <Text style={styles.statusNumber}>1</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Sources */}
      <View style={[styles.section, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Sources</Text>
        
        <View style={styles.sourcesList}>
          {result.sources.map((source, index) => (
            <TouchableOpacity
              key={source.id}
              style={[styles.sourceItem, { borderColor: colors.border }]}
              onPress={() => handleSourcePress(source.url)}
              activeOpacity={0.7}
            >
              <View style={styles.sourceIcon}>
                <Ionicons name="globe" size={16} color={source.isReliable ? '#4CAF50' : '#FF9800'} />
              </View>
              <View style={styles.sourceContent}>
                <Text style={[styles.sourceTitle, { color: colors.text }]} numberOfLines={1}>
                  {source.title}
                </Text>
                <Text style={[styles.sourceDomain, { color: colors.text + '80' }]} numberOfLines={1}>
                  {source.domain}
                </Text>
              </View>
              <View style={styles.sourceMore}>
                <Text style={[styles.moreText, { color: colors.text + '60' }]}>+25 more</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Verification Result */}
      <View style={[styles.section, { backgroundColor: colors.background }]}>
        <View style={styles.resultHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Verification Result</Text>
          <Text style={[styles.claimsCount, { color: colors.text + '80' }]}>
            {result.claimsAnalyzed} claims verified
          </Text>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={styles.progressSegments}>
              <View style={[styles.progressSegment, { backgroundColor: '#00C851', width: '64%' }]} />
              <View style={[styles.progressSegment, { backgroundColor: '#FF4444', width: '9%' }]} />
              <View style={[styles.progressSegment, { backgroundColor: '#9C27B0', width: '27%' }]} />
              <View style={[styles.progressSegment, { backgroundColor: '#2196F3', width: '0%' }]} />
            </View>
          </View>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressLabel, { color: '#00C851' }]}>
              ● Supported 64%
            </Text>
            <Text style={[styles.progressLabel, { color: '#FF4444' }]}>
              ● Refuted 9%
            </Text>
            <Text style={[styles.progressLabel, { color: '#9C27B0' }]}>
              ● Insufficient Evidence 27%
            </Text>
            <Text style={[styles.progressLabel, { color: '#2196F3' }]}>
              ● Conflicting 0%
            </Text>
          </View>
        </View>
      </View>

      {/* Processed Answer */}
      <View style={[styles.section, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Processed Answer</Text>
        <View style={[styles.answerContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.answerText, { color: colors.text }]}>
            {result.processedAnswer}
          </Text>
        </View>
      </View>

      {/* Fast Check Summary */}
      <View style={[styles.section, { backgroundColor: colors.background, marginBottom: 100 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Fast Check Summary</Text>
        
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}>
              <View style={styles.summaryIcons}>
                <Ionicons name="globe" size={16} color="#4CAF50" />
                <Ionicons name="document" size={16} color="#4CAF50" />
                <Ionicons name="newspaper" size={16} color="#4CAF50" />
                <Ionicons name="search" size={16} color="#4CAF50" />
                <Text style={[styles.moreIndicator, { color: colors.text + '60' }]}>⋯</Text>
              </View>
              <Text style={[styles.summaryText, { color: colors.text }]}>
                Newton&apos;s laws of motion
              </Text>
              <Text style={[styles.summarySubtext, { color: colors.text + '80' }]}>
                Any state that Isaac Newton formulated three laws of motion, 
                as stated in the Principia (Sources 1), Newton (Source 2), and Science Facts (Source
              </Text>
            </View>
            
            <View style={styles.summaryRight}>
              <VerdictIcon status="refuted" />
              <Text style={[styles.verdictLabel, { color: '#FF4444' }]}>Refuted</Text>
              
              <Text style={[styles.summaryNote, { color: colors.text + '60' }]}>
                The Wright brothers completed the first powered f
              </Text>
              <Text style={[styles.summaryNote, { color: colors.text + '60' }]}>
                Multiple sources clearly state that the Wright brothers comp
                flight in 1903, not 1912.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// Export the VerificationResults component
export default VerificationResults;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusItem: {
    minWidth: '30%',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  sourcesList: {
    gap: 8,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  sourceIcon: {
    marginRight: 8,
  },
  sourceContent: {
    flex: 1,
  },
  sourceTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  sourceDomain: {
    fontSize: 12,
  },
  sourceMore: {
    marginLeft: 8,
  },
  moreText: {
    fontSize: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  claimsCount: {
    fontSize: 12,
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressSegments: {
    flexDirection: 'row',
    height: '100%',
  },
  progressSegment: {
    height: '100%',
  },
  progressLabels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 12,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  answerContainer: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  answerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  summaryContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryLeft: {
    flex: 1,
  },
  summaryIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  moreIndicator: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 12,
    lineHeight: 16,
  },
  summaryRight: {
    alignItems: 'center',
    minWidth: 80,
  },
  verdictLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 8,
  },
  summaryNote: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 12,
    marginBottom: 4,
  },
});