"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const getClosestWord = (word, dictionary) => {
  if (dictionary[word]) {
    return word;
  }
  
  let minDistance = Infinity;
  let closestWord = word; 
  
  Object.keys(dictionary).forEach(dictWord => {
    const distance = levenshteinDistance(word, dictWord);
    if (distance < minDistance && distance <= 2) {
      minDistance = distance;
      closestWord = dictWord;
    }
  });
  
  return closestWord;
};

const levenshteinDistance = (a, b) => {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      tmp[i][j] = Math.min(tmp[i - 1][j] + 1, tmp[i][j - 1] + 1, tmp[i - 1][j - 1] + cost);
    }
  }
  return tmp[a.length][b.length];
};

const identifyComponents = (sentence, subjects, objects, verbs) => {
  const words = sentence.split(' ');
  let identified = {
    subject: null,
    object: null,
    verb: null,
    timeWord: null,
    tense: 'present',
    originalWords: {},
    correctedWords: [...words]
  };

  const timeWords = ['පෙරෙදා', 'ඊයෙ', 'ඉස්සර'];

  words.forEach((word, index) => {
    if (subjects[word]) {
      identified.subject = word;
      identified.correctedWords[index] = word;
    } else if (objects[word]) {
      identified.object = word;
      identified.correctedWords[index] = word;
    } else if (verbs[word]) {
      identified.verb = word;
      identified.correctedWords[index] = word;
      if (word.endsWith('ා')) {
        identified.tense = 'past';
      }
    } else if (timeWords.includes(word)) {
      identified.timeWord = word;
      identified.correctedWords[index] = word;
      identified.tense = 'past';
    }
  });

  words.forEach((word, index) => {
    if (subjects[word] || objects[word] || verbs[word] || timeWords.includes(word)) {
      return;
    }

    if (!identified.object) {
      const closestObject = getClosestWord(word, objects);
      if (closestObject !== word) {
        identified.object = closestObject;
        identified.originalWords[word] = closestObject;
        identified.correctedWords[index] = closestObject;
        return;
      }
    }

    if (!identified.subject) {
      const closestSubject = getClosestWord(word, subjects);
      if (closestSubject !== word) {
        identified.subject = closestSubject;
        identified.originalWords[word] = closestSubject;
        identified.correctedWords[index] = closestSubject;
        return;
      }
    }

    if (!identified.verb) {
      const closestVerb = getClosestWord(word, verbs);
      if (closestVerb !== word) {
        identified.verb = closestVerb;
        identified.originalWords[word] = closestVerb;
        identified.correctedWords[index] = closestVerb;
        if (closestVerb.endsWith('ා')) {
          identified.tense = 'past';
        }
        return;
      }
    }
  });

  return identified;
};

const buildGrammaticalSentence = (components) => {
  const orderedWords = [];
  
  if (components.subject) {
    orderedWords.push(components.subject);
  }
 
  if (components.object) {
    orderedWords.push(components.object);
  }
  
  if (components.timeWord) {
    orderedWords.push(components.timeWord);
  }
  
  if (components.verb) {
    orderedWords.push(components.verb);
  }
  
  return orderedWords;
};

const getCorrectVerb = (verb, subject, tense, verbs, subjects) => {
  const verbInfo = verbs[verb];
  const subjectInfo = subjects[subject];

  if (!verbInfo || !subjectInfo) return null;

  const verbBase = verbInfo[tense]?.[subjectInfo.person];
  if (!verbBase) return null;

  return verbBase + subjectInfo.suffix;
};

const SinhalaGrammarChecker = () => {
  const [userInput, setUserInput] = useState('');
  const [correction, setCorrection] = useState('');
  const [errors, setErrors] = useState([]);
  const [corrections, setCorrections] = useState({});
  const [loading, setLoading] = useState(true);

  const [subjects, setSubjects] = useState({});
  const [verbs, setVerbs] = useState({});
  const [objects, setObjects] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [subjectsData, verbsData, objectsData] = await Promise.all([
          import('../data/subjects.json'),
          import('../data/verbs.json'),
          import('../data/objects.json'),
        ]);

        setSubjects(subjectsData.default);
        setVerbs(verbsData.default);
        setObjects(objectsData.default);
        setLoading(false);
      } catch (error) {
        console.error('Error loading dictionary data:', error);
        setErrors(prev => [...prev, 'Error loading dictionary data']);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const checkGrammar = () => {
    const components = identifyComponents(userInput, subjects, objects, verbs);
    let newErrors = [];

    setCorrections(components.originalWords);

    if (!components.subject) {
      newErrors.push('No subject found in the sentence');
    }

    if (!components.verb) {
      newErrors.push('No verb found in the sentence');
    }

    if (components.subject && components.verb) {
      const orderedWords = buildGrammaticalSentence(components);
      
      const correctedVerb = getCorrectVerb(
        components.verb,
        components.subject,
        components.tense,
        verbs,
        subjects
      );

      if (correctedVerb) {
        orderedWords[orderedWords.length - 1] = correctedVerb;
      }

      setCorrection(orderedWords.join(' '));
    } else {
      setCorrection('Unable to correct sentence');
    }

    setErrors(newErrors);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          Loading dictionary data...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>සිංහල ව්‍යාකරණ පරීක්ෂකය</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Available Words:</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium mb-1">Subjects:</h4>
                <div className="text-sm space-y-1">
                  {Object.keys(subjects).map(subject => (
                    <div key={subject}>{subject}</div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-1">Objects:</h4>
                <div className="text-sm space-y-1">
                  {Object.keys(objects).map(object => (
                    <div key={object}>{object}</div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-1">Verbs:</h4>
                <div className="text-sm space-y-1">
                  {Object.keys(verbs).map(verb => (
                    <div key={verb}>{verb}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Enter Sinhala sentence..."
              className="w-full"
            />
            <Button onClick={checkGrammar} className="w-full">
              Check Grammar
            </Button>
          </div>

          {correction && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Corrected Sentence:</h3>
              <div className="p-2 bg-green-50 rounded">{correction}</div>
            </div>
          )}

          {Object.keys(corrections).length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Word Corrections:</h3>
              <div className="space-y-1">
                {Object.entries(corrections).map(([original, corrected], index) => (
                  <div key={index} className="text-blue-600">
                    {original} → {corrected}
                  </div>
                ))}
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Errors Found:</h3>
              <div className="space-y-1">
                {errors.map((error, index) => (
                  <div key={index} className="text-red-500">{error}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SinhalaGrammarChecker;