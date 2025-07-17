
"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getNewsForTopic, type GetNewsOutput } from "@/ai/flows/news-flow";
import Image from "next/image";
import Link from "next/link";
import { Newspaper, BookOpen } from "lucide-react";

type Article = GetNewsOutput["articles"][0];

const NEWS_TOPICS = ["Technology", "Sports", "Business", "Health", "Entertainment", "Science"];

export default function InterestsPage() {
  const [selectedTopic, setSelectedTopic] = useState<string>(NEWS_TOPICS[0]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      try {
        const response = await getNewsForTopic({ topic: selectedTopic });
        setArticles(response.articles);
      } catch (error) {
        console.error(`Failed to fetch news for topic: ${selectedTopic}`, error);
        setArticles([]); // Clear articles on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [selectedTopic]);

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto p-2 sm:p-4 md:p-6 relative z-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="font-headline text-2xl sm:text-3xl font-bold flex items-center">
          <Newspaper className="mr-2 sm:mr-3 h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          Your News Feed
        </h1>
        <div className="w-full sm:w-64">
          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a topic" />
            </SelectTrigger>
            <SelectContent>
              {NEWS_TOPICS.map((topic) => (
                <SelectItem key={topic} value={topic}>
                  {topic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-grow">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="flex flex-col">
                <CardHeader>
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-24" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => (
              <Card key={index} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="relative w-full aspect-video bg-muted rounded-t-lg overflow-hidden">
                    <Image
                        src={article.imageUrl}
                        alt={article.title}
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint="news article"
                    />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
                  <CardDescription>Source: {article.source}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {article.description}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="secondary" className="w-full">
                    <Link href={article.url} target="_blank" rel="noopener noreferrer">
                       <BookOpen className="mr-2 h-4 w-4" /> Read More
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10">
            <Newspaper className="h-16 w-16 mb-4" />
            <p className="text-lg font-semibold">No Articles Found</p>
            <p className="text-sm">Could not fetch news for "{selectedTopic}". Please try another topic or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
