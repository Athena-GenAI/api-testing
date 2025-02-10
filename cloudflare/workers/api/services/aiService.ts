/**
 * AI Service
 * 
 * Utilizes Cloudflare Workers AI to analyze market positions and predict trends.
 * Features:
 * - Pattern recognition in trader behavior
 * - Market sentiment analysis
 * - Anomaly detection
 * - Price trend predictions
 * - Historical pattern analysis
 */

import { TokenPosition, Position, HistoricalAnalysis, TokenStats } from '../types';

export class AIService {
  constructor(private ai: any) {}

  /**
   * Analyze position patterns for a token
   * Uses @workersai/sentiment to analyze market sentiment
   * 
   * @param positions - Array of positions for analysis
   * @returns Analysis results including sentiment and confidence
   */
  async analyzePositionPatterns(positions: Position[]): Promise<{
    sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    confidence: number;
    factors: string[];
  }> {
    // Prepare input for the model
    const input = this.preparePositionData(positions);

    // Run sentiment analysis
    const sentiment = await this.ai.run('@cf/sentiment', {
      text: JSON.stringify(input)
    });

    // Process results
    const { score } = sentiment;
    const confidence = Math.abs(score);
    
    let marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (score > 0.2) marketSentiment = 'BULLISH';
    else if (score < -0.2) marketSentiment = 'BEARISH';

    // Identify contributing factors
    const factors = await this.identifyFactors(positions, score);

    return {
      sentiment: marketSentiment,
      confidence: parseFloat((confidence * 100).toFixed(2)),
      factors
    };
  }

  /**
   * Detect market anomalies using AI
   * Uses @workersai/anomaly-detection for pattern recognition
   * 
   * @param tokenStats - Current token statistics
   * @returns Anomaly detection results
   */
  async detectAnomalies(tokenStats: TokenPosition[]): Promise<any[]> {
    // Filter out positions with less than 5 total positions
    const significantStats = tokenStats.filter(stat => stat.total_positions >= 5);

    // Calculate mean and standard deviation of percentages
    const percentages = significantStats.map(stat => parseFloat(stat.percentage));
    const mean = this.calculateMean(percentages);
    const stdDev = this.calculateStandardDeviation(percentages, mean);

    // Detect anomalies (positions more than 2 standard deviations from mean)
    const anomalies: any[] = [];
    for (const stat of significantStats) {
      const percentage = parseFloat(stat.percentage);
      if (Math.abs(percentage - mean) > 2 * stdDev) {
        anomalies.push({
          token: stat.token,
          percentage: stat.percentage,
          position: stat.position,
          total_positions: stat.total_positions,
          deviation: Math.abs(percentage - mean) / stdDev
        });
      }
    }

    return anomalies;
  }

  /**
   * Predict price trends using historical data
   * Uses @workersai/text-generation for natural language insights
   * 
   * @param token - Token symbol
   * @param historicalData - Historical market data
   * @returns Price trend prediction and confidence
   */
  async predictTrends(
    token: string,
    historicalData: any[]
  ): Promise<{
    prediction: string;
    confidence: number;
    timeframe: string;
    supporting_data: any;
  }> {
    // Prepare prompt for the model
    const prompt = this.prepareTrendAnalysisPrompt(token, historicalData);

    // Generate prediction
    const prediction = await this.ai.run('@cf/text-generation', {
      prompt
    });

    return this.processPredictionResults(prediction);
  }

  /**
   * Analyze historical patterns in position data
   * Uses @workersai/timeseries to detect trends
   * 
   * @param positions Array of positions ordered by timestamp
   * @returns Historical analysis results
   */
  async analyzeHistoricalPatterns(positions: Position[]): Promise<HistoricalAnalysis> {
    // Sort positions by timestamp
    const sortedPositions = [...positions].sort((a, b) => {
      const aTime = new Date(a.openBlockTime).getTime();
      const bTime = new Date(b.openBlockTime).getTime();
      return aTime - bTime;
    });
    
    // Prepare time series data
    const timeSeriesData = sortedPositions.map(pos => ({
      timestamp: new Date(pos.openBlockTime).getTime(),
      value: pos.size * (pos.isLong ? 1 : -1)
    }));

    // Run time series analysis
    const trendAnalysis = await this.ai.run('@cf/timeseries', {
      data: timeSeriesData,
      window: Math.min(timeSeriesData.length, 3) // Use sliding window of up to 3 points
    });

    // Calculate confidence over time using sentiment analysis
    const confidenceOverTime = await Promise.all(
      sortedPositions.map(async (pos) => {
        const sentiment = await this.analyzePositionPatterns([pos]);
        return {
          timestamp: new Date(pos.openBlockTime).getTime(),
          confidence: sentiment.confidence
        };
      })
    );

    // Determine trend direction
    const lastValue = timeSeriesData[timeSeriesData.length - 1].value;
    const firstValue = timeSeriesData[0].value;
    const trendStrength = Math.abs(lastValue - firstValue) / Math.abs(firstValue);
    
    let trendDirection: 'UP' | 'DOWN' | 'SIDEWAYS' = 'SIDEWAYS';
    if (trendStrength > 0.1) { // 10% change threshold
      trendDirection = lastValue > firstValue ? 'UP' : 'DOWN';
    }

    return {
      trendDirection,
      confidenceOverTime
    };
  }

  /**
   * Prepare position data for AI analysis
   * @param positions Array of positions
   * @returns Formatted data for AI model
   */
  private preparePositionData(positions: Position[]): any {
    return positions.map(pos => ({
      size: pos.size,
      leverage: pos.leverage,
      type: pos.type,
      openBlockTime: pos.openBlockTime,
      pnl: pos.pnl,
      isLong: pos.isLong
    }));
  }

  /**
   * Identify factors contributing to the analysis
   * @param positions Array of positions
   * @param sentimentScore Sentiment score from analysis
   * @returns Array of contributing factors
   */
  private async identifyFactors(positions: Position[], sentimentScore: number): Promise<string[]> {
    const factors: string[] = [];
    
    // Size analysis
    const avgSize = positions.reduce((sum, pos) => sum + pos.size, 0) / positions.length;
    if (avgSize > 1000) factors.push('Large position sizes');
    
    // Leverage analysis
    const avgLeverage = positions.reduce((sum, pos) => sum + pos.leverage, 0) / positions.length;
    if (avgLeverage > 2) factors.push('High leverage');
    
    // Direction consistency
    const longCount = positions.filter(pos => pos.isLong).length;
    const directionRatio = longCount / positions.length;
    if (directionRatio > 0.7) factors.push('Predominantly long positions');
    if (directionRatio < 0.3) factors.push('Predominantly short positions');
    
    // PnL analysis
    const avgPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0) / positions.length;
    if (avgPnl > 0) factors.push('Positive PnL trend');
    if (avgPnl < 0) factors.push('Negative PnL trend');
    
    // Sentiment strength
    if (Math.abs(sentimentScore) > 0.8) {
      factors.push('Strong market conviction');
    }
    
    return factors;
  }

  /**
   * Prepare time series data for anomaly detection
   */
  private prepareTimeSeriesData(historicalData: any[]): any[] {
    return historicalData.map(data => ({
      timestamp: new Date(data.timestamp).getTime(),
      value: data.dominant_percentage,
      positions: data.total_positions
    }));
  }

  /**
   * Process anomaly detection results
   */
  private processAnomalyResults(results: any, currentStats: TokenPosition[]): any[] {
    const anomalies: any[] = [];
    
    results.anomalies.forEach((anomaly: any) => {
      const relevantStat = currentStats.find(stat => 
        parseFloat(stat.percentage) > anomaly.threshold
      );
      
      if (relevantStat) {
        anomalies.push({
          token: relevantStat.token,
          description: `Anomaly detected for ${relevantStat.token}`,
          severity: anomaly.severity,
          value: anomaly.value,
          percentage: relevantStat.percentage,
          position: relevantStat.position
        });
      }
    });
    
    return anomalies;
  }

  /**
   * Calculate severity of detected anomalies
   */
  private calculateSeverity(anomalies: any[]): number {
    if (anomalies.length === 0) return 0;
    
    const avgSeverity = anomalies.reduce((acc, a) => acc + a.severity, 0) / anomalies.length;
    return parseFloat(avgSeverity.toFixed(2));
  }

  /**
   * Generate recommendations based on detected anomalies
   */
  private generateRecommendations(anomalies: any[]): string[] {
    const recommendations: string[] = [];
    
    if (anomalies.length === 0) {
      recommendations.push('No significant anomalies detected');
      return recommendations;
    }

    // Group anomalies by type and severity
    const severeAnomalies = anomalies.filter(a => a.severity > 0.7);
    const moderateAnomalies = anomalies.filter(a => a.severity > 0.3 && a.severity <= 0.7);

    if (severeAnomalies.length > 0) {
      recommendations.push('High priority: Monitor severe market movements');
    }

    if (moderateAnomalies.length > 0) {
      recommendations.push('Medium priority: Watch for developing trends');
    }

    return recommendations;
  }

  /**
   * Prepare prompt for trend analysis
   */
  private prepareTrendAnalysisPrompt(token: string, historicalData: any[]): string {
    const recentData = historicalData.slice(-5);
    const trendDescription = recentData
      .map(d => `${d.timestamp}: ${d.position_type} ${d.dominant_percentage}%`)
      .join('\n');

    return `Analyze the following market data for ${token}:\n${trendDescription}\n\nPredict the likely market trend and provide confidence level.`;
  }

  /**
   * Process prediction results from the model
   */
  private processPredictionResults(prediction: any): any {
    // Extract key information from the prediction text
    const lines = prediction.text.split('\n');
    const predictionLine = lines.find((l: string) => l.toLowerCase().includes('predict')) || '';
    const confidenceLine = lines.find((l: string) => l.toLowerCase().includes('confidence')) || '';

    return {
      prediction: this.extractPrediction(predictionLine),
      confidence: this.extractConfidence(confidenceLine),
      timeframe: '24h',
      supporting_data: {
        raw_prediction: prediction.text,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Extract prediction from AI response
   * @param response AI response
   * @returns Extracted prediction
   */
  private extractPrediction(text: string): string {
    const lines = text.split('\n');
    const predictionLine = lines.find((line: string) => line.toLowerCase().includes('predict')) || '';
    const confidenceLine = lines.find((line: string) => line.toLowerCase().includes('confidence')) || '';
    
    // Extract sentiment from prediction line
    let sentiment = 'NEUTRAL';
    if (predictionLine.toLowerCase().includes('bullish')) sentiment = 'BULLISH';
    if (predictionLine.toLowerCase().includes('bearish')) sentiment = 'BEARISH';
    
    // Extract confidence from confidence line
    const confidenceMatch = confidenceLine.match(/\d+(\.\d+)?/);
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[0]) : 0;
    
    return `${sentiment} (${confidence.toFixed(2)}% confidence)`;
  }

  /**
   * Extract confidence value from text
   * @param text Text to extract confidence from
   * @returns Confidence value
   */
  private extractConfidence(text: string): number {
    const match = text.match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 50;
  }

  /**
   * Analyze text for sentiment
   * @param text Text to analyze
   * @returns Sentiment analysis result
   */
  private analyzeSentiment(text: string): { sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; confidence: number } {
    const lines = text.split('\n');
    const predictionLine = lines.find((line: string) => line.toLowerCase().includes('predict')) || '';
    const confidenceLine = lines.find((line: string) => line.toLowerCase().includes('confidence')) || '';
    
    let sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (predictionLine.toLowerCase().includes('bullish')) sentiment = 'BULLISH';
    if (predictionLine.toLowerCase().includes('bearish')) sentiment = 'BEARISH';
    
    const confidence = this.extractConfidence(confidenceLine);
    
    return { sentiment, confidence };
  }

  /**
   * Find relevant statistics for a token
   * @param token Token to find stats for
   * @param currentStats Current statistics
   * @returns Relevant statistics for the token
   */
  private findRelevantStats(token: string, currentStats: TokenStats[]): TokenStats | undefined {
    return currentStats.find((stat: TokenStats) => stat.token === token);
  }

  /**
   * Calculate mean of an array of numbers
   * @param numbers Array of numbers
   * @returns Mean value
   */
  private calculateMean(numbers: number[]): number {
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  /**
   * Calculate standard deviation of an array of numbers
   * @param numbers Array of numbers
   * @param mean Mean value
   * @returns Standard deviation
   */
  private calculateStandardDeviation(numbers: number[], mean: number): number {
    const squaredDifferences = numbers.map(num => Math.pow(num - mean, 2));
    const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / numbers.length;
    return Math.sqrt(variance);
  }
}
