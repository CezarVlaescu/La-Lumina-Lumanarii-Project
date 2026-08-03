"use client";

import Link from "next/link";
import { useState } from "react";
import { products } from "../lib/catalog";
import { ArrowIcon } from "./icons";

const questions = [
  {
    title: "Ce colț de Crăciun vrei să luminezi?",
    options: [
      { label: "Un decor de poveste, cu brad și zăpadă", value: 0 },
      { label: "Un colț vesel, cu figurine", value: 1 },
      { label: "Masa de sărbătoare", value: 2 },
    ],
  },
  {
    title: "Ce formă te atrage?",
    options: [
      { label: "O căsuță de iarnă", value: 0 },
      { label: "Un omuleț de turtă dulce", value: 1 },
      { label: "O căniță festivă", value: 2 },
    ],
  },
  {
    title: "Alege atmosfera.",
    options: [
      { label: "Albastru de iarnă și verde brad", value: 0 },
      { label: "Culori jucăușe și accente aurii", value: 1 },
      { label: "Roșu festiv și auriu", value: 2 },
    ],
  },
] as const;

export function ScentQuiz() {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState([0, 0, 0]);

  function answer(value: number) {
    setScores((current) => current.map((score, index) => score + Number(index === value)));
    setStep((current) => current + 1);
  }

  if (step >= questions.length) {
    const best = scores.indexOf(Math.max(...scores));
    const product = products[best];
    return (
      <div className="quiz-result">
        <p className="eyebrow eyebrow--gold">Potrivirea ta</p>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <div className="quiz-result__notes">{product.details.map((detail) => <span key={detail}>{detail}</span>)}</div>
        <Link className="button button--primary" href={`/lumanari/${product.slug}`}>Descoperă lumânarea <ArrowIcon /></Link>
        <button className="text-link" onClick={() => { setStep(0); setScores([0, 0, 0]); }}>Reia ritualul</button>
      </div>
    );
  }

  const question = questions[step];
  return (
    <div className="quiz-card">
      <div className="quiz-progress"><span style={{ width: `${((step + 1) / questions.length) * 100}%` }} /></div>
      <p className="eyebrow">Întrebarea {step + 1} din {questions.length}</p>
      <h1>{question.title}</h1>
      <div className="quiz-options">
        {question.options.map((option) => (
          <button key={option.label} onClick={() => answer(option.value)}>
            <span>{option.label}</span><ArrowIcon />
          </button>
        ))}
      </div>
    </div>
  );
}
