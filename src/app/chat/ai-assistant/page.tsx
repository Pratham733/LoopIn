
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Upload, 
  Bot, 
  User, 
  Sparkles, 
  Lightbulb, 
  Zap, 
  Heart, 
  Code, 
  Image, 
  Mic, 
  Settings,
  MessageSquare,
  Brain,
  Palette,
  TrendingUp,
  Clock,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ChatbotInput, ChatbotOutput, HistoryMessage } from '@/ai/flows/chatbot-flow';

interface EnhancedMessage extends HistoryMessage {
  suggestions?: string[];
  quickActions?: Array<{label: string, action: string, icon?: string, description?: string}>;
  emotion?: string;
  confidence?: number;
  followUpQuestions?: string[];
  relatedTopics?: string[];
  codeSnippet?: {language: string, code: string, explanation: string};
}

export default function AIAssistantPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [personality, setPersonality] = useState<'professional' | 'casual' | 'creative' | 'technical' | 'friendly'>('friendly');
  const [features, setFeatures] = useState({
    enableSuggestions: true,
    enableQuickActions: true,
    enableEmotionAnalysis: true,
    enableContextAwareness: true
  });
  const [context, setContext] = useState({
    userPreferences: [] as string[],
    currentTask: '',
    userMood: 'neutral' as 'happy' | 'sad' | 'stressed' | 'excited' | 'neutral',
    timeOfDay: new Date().toLocaleTimeString(),
    userExpertise: 'intermediate' as 'beginner' | 'intermediate' | 'expert'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() && !selectedFile) return;

    const userMessage: EnhancedMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
      metadata: {
        emotion: analyzeEmotion(input),
        confidence: 1.0
      }
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const requestBody: ChatbotInput = {
        userInput: input,
        personality,
        context,
        features,
        history: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          metadata: msg.metadata
        })),
        ...(selectedFile && {
          attachment: {
            dataUri: await fileToDataUri(selectedFile),
            mimeType: selectedFile.type,
            name: selectedFile.name
          }
        })
      };

      const response = await fetch('/api/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const result: ChatbotOutput = await response.json();

      const aiMessage: EnhancedMessage = {
        role: 'model',
        content: result.aiResponse,
        timestamp: new Date().toISOString(),
        suggestions: result.suggestions,
        quickActions: result.quickActions,
        emotion: result.emotion,
        confidence: result.confidence,
        followUpQuestions: result.followUpQuestions,
        relatedTopics: result.relatedTopics,
        codeSnippet: result.codeSnippet,
        metadata: {
          emotion: result.emotion,
          confidence: result.confidence,
          suggestions: result.suggestions,
          quickActions: result.quickActions
        }
      };

      setMessages(prev => [...prev, aiMessage]);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const analyzeEmotion = (text: string): 'happy' | 'sad' | 'angry' | 'neutral' | 'excited' | 'confused' => {
    const input = text.toLowerCase();
    if (input.includes('😊') || input.includes('happy') || input.includes('great')) return 'happy';
    if (input.includes('😢') || input.includes('sad') || input.includes('sorry')) return 'sad';
    if (input.includes('😠') || input.includes('angry') || input.includes('frustrated')) return 'angry';
    if (input.includes('🤔') || input.includes('confused') || input.includes('not sure')) return 'confused';
    if (input.includes('🎉') || input.includes('excited') || input.includes('amazing')) return 'excited';
    return 'neutral';
  };

  const handleQuickAction = (action: string) => {
    let actionInput = '';
    switch (action) {
      case 'generate_code':
        actionInput = 'Can you generate some code for me?';
        break;
      case 'analyze_image':
        actionInput = 'I want to analyze an image.';
        break;
      case 'ask_followup':
        actionInput = 'Can you ask me a follow-up question?';
        break;
      default:
        actionInput = 'Tell me more about this.';
    }
    setInput(actionInput);
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  const getPersonalityIcon = (personality: string) => {
    switch (personality) {
      case 'professional': return '💼';
      case 'casual': return '😊';
      case 'creative': return '🎨';
      case 'technical': return '⚙️';
      case 'friendly': return '🤝';
      default: return '🤖';
    }
  };

  const getEmotionColor = (emotion?: string) => {
    switch (emotion) {
      case 'happy': return 'text-green-500';
      case 'sad': return 'text-blue-500';
      case 'angry': return 'text-red-500';
      case 'excited': return 'text-yellow-500';
      case 'confused': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card/50 p-4 space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Assistant
          </h2>
          <p className="text-sm text-muted-foreground">
            Advanced AI with enhanced features
          </p>
        </div>

        <Separator />

        {/* Personality Settings */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Personality Mode</Label>
          <Select value={personality} onValueChange={(value: any) => setPersonality(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">
                <span className="flex items-center gap-2">
                  💼 Professional
                </span>
              </SelectItem>
              <SelectItem value="casual">
                <span className="flex items-center gap-2">
                  😊 Casual
                </span>
              </SelectItem>
              <SelectItem value="creative">
                <span className="flex items-center gap-2">
                  🎨 Creative
                </span>
              </SelectItem>
              <SelectItem value="technical">
                <span className="flex items-center gap-2">
                  ⚙️ Technical
                </span>
              </SelectItem>
              <SelectItem value="friendly">
                <span className="flex items-center gap-2">
                  🤝 Friendly
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Features Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Smart Suggestions</label>
            <Switch
              checked={features.enableSuggestions}
              onCheckedChange={(checked) => setFeatures(prev => ({ ...prev, enableSuggestions: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Quick Actions</label>
            <Switch
              checked={features.enableQuickActions}
              onCheckedChange={(checked) => setFeatures(prev => ({ ...prev, enableQuickActions: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Emotion Analysis</label>
            <Switch
              checked={features.enableEmotionAnalysis}
              onCheckedChange={(checked) => setFeatures(prev => ({ ...prev, enableEmotionAnalysis: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Context Awareness</label>
            <Switch
              checked={features.enableContextAwareness}
              onCheckedChange={(checked) => setFeatures(prev => ({ ...prev, enableContextAwareness: checked }))}
            />
          </div>
        </div>

        {/* Context Settings */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Context</Label>
          <div className="space-y-2">
            <div>
              <Label className="text-xs">User Mood</Label>
              <Select value={context.userMood} onValueChange={(value: any) => setContext(prev => ({ ...prev, userMood: value }))}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="happy">😊 Happy</SelectItem>
                  <SelectItem value="sad">😢 Sad</SelectItem>
                  <SelectItem value="stressed">😰 Stressed</SelectItem>
                  <SelectItem value="excited">🎉 Excited</SelectItem>
                  <SelectItem value="neutral">😐 Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Expertise Level</Label>
              <Select value={context.userExpertise} onValueChange={(value: any) => setContext(prev => ({ ...prev, userExpertise: value }))}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">🌱 Beginner</SelectItem>
                  <SelectItem value="intermediate">📚 Intermediate</SelectItem>
                  <SelectItem value="expert">🏆 Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="/bot-avatar.png" />
                <AvatarFallback>
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">LoopIn AI Assistant</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{getPersonalityIcon(personality)} {personality}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    Enhanced
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Advanced
              </Badge>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'model' && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/bot-avatar.png" />
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[70%] space-y-2 ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  <Card className={`${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.confidence && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round(message.confidence * 100)}%
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Features Display */}
                  {message.role === 'model' && (
                    <div className="space-y-2">
                      {/* Emotion */}
                      {message.emotion && (
                        <div className="flex items-center gap-2 text-xs">
                          <Heart className={`h-3 w-3 ${getEmotionColor(message.emotion)}`} />
                          <span className={getEmotionColor(message.emotion)}>
                            Detected: {message.emotion}
                          </span>
                        </div>
                      )}

                      {/* Code Snippet */}
                      {message.codeSnippet && (
                        <Card className="bg-muted/50">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Code className="h-4 w-4" />
                              <span className="text-sm font-medium">{message.codeSnippet.language}</span>
                            </div>
                            <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                              <code>{message.codeSnippet.code}</code>
                            </pre>
                            <p className="text-xs text-muted-foreground mt-2">
                              {message.codeSnippet.explanation}
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Quick Actions */}
                      {message.quickActions && message.quickActions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {message.quickActions.map((action, actionIndex) => (
                            <Button
                              key={actionIndex}
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickAction(action.action)}
                              className="text-xs"
                            >
                              {action.icon} {action.label}
                            </Button>
                          ))}
                        </div>
                      )}

                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Suggestions:</Label>
                          <div className="flex flex-wrap gap-1">
                            {message.suggestions.map((suggestion, suggestionIndex) => (
                              <Button
                                key={suggestionIndex}
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSuggestion(suggestion)}
                                className="text-xs h-6"
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Follow-up Questions */}
                      {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Follow-up Questions:</Label>
                          <div className="space-y-1">
                            {message.followUpQuestions.map((question, questionIndex) => (
                              <Button
                                key={questionIndex}
                                variant="ghost"
                                size="sm"
                                onClick={() => setInput(question)}
                                className="text-xs h-6 w-full justify-start"
                              >
                                ❓ {question}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Related Topics */}
                      {message.relatedTopics && message.relatedTopics.length > 0 && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Related Topics:</Label>
                          <div className="flex flex-wrap gap-1">
                            {message.relatedTopics.map((topic, topicIndex) => (
                              <Badge key={topicIndex} variant="secondary" className="text-xs">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/user-avatar.png" />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything... (I can analyze images, generate code, and much more!)"
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  {selectedFile.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    ✕
                  </Button>
              </div>
            )}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || (!input.trim() && !selectedFile)}
                className="h-[60px] w-[60px]"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('file-upload')?.click()}
                className="h-8 w-8 p-0"
              >
                <Upload className="h-4 w-4" />
            </Button>
            </div>
          </div>
          <input
            id="file-upload"
            type="file"
            accept="image/*,.pdf,.txt,.doc,.docx"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
