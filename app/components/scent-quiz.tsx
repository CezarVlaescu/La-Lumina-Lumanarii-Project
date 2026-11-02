"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "../lib/catalog";
import { ArrowIcon } from "./icons";

const recommendationSlugs = [
  [
    "casuta-lui-mos-craciun",
    "casuta-bradut-nins",
    "poveste-de-iarna",
    "bradut-alb-perlat",
    "bradut-verde-padure",
  ],
  [
    "omulet-de-turta-dulce",
    "trenuletul-lui-mos-craciun",
    "cadou-de-craciun",
    "saculet-de-craciun-ren",
  ],
  [
    "canita-de-craciun",
    "glob-de-craciun-cu-capac",
    "saculet-de-craciun-brad",
    "bradut-alb-perlat",
  ],
] as const;

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

export function ScentQuiz({ products }: { products: Product[] }) {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState([0, 0, 0]);

  function answer(value: number) {
    setScores((current) => current.map((score, index) => score + Number(index === value)));
    setStep((current) => current + 1);
  }

  if (step >= questions.length) {
    const best = scores.indexOf(Math.max(...scores));
    const product =
      recommendationSlugs[best]
        .map((slug) => products.find((item) => item.slug === slug))
        .find((item): item is Product => Boolean(item)) ?? products[0];

    if (!product) {
      return (
        <div className="quiz-result">
          <p className="eyebrow eyebrow--gold">Ghid în pregătire</p>
          <h1>Mai adăugăm câteva produse.</h1>
          <p>Revino după completarea colecției sau vezi modelele disponibile acum.</p>
          <Link className="button button--primary" href="/lumanari">
            Vezi lumânările <ArrowIcon />
          </Link>
        </div>
      );
    }

    return (
      <div className="quiz-result">
        <p className="eyebrow eyebrow--gold">Potrivirea ta</p>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <div className="quiz-result__notes">{product.details.map((detail) => <span key={detail}>{detail}</span>)}</div>
        <Link className="button button--primary" href={`/lumanari/${product.slug}`}>Descoperă lumânarea <ArrowIcon /></Link>
        <button type="button" className="text-link" onClick={() => { setStep(0); setScores([0, 0, 0]); }}>Reia ghidul</button>
      </div>
    );
  }

  const question = questions[step];
  return (
    <div className="quiz-card">
      <div
        className="quiz-progress"
        role="progressbar"
        aria-label="Progresul ghidului"
        aria-valuemin={1}
        aria-valuemax={questions.length}
        aria-valuenow={step + 1}
      >
        <span style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
      </div>
      <p className="eyebrow">Întrebarea {step + 1} din {questions.length}</p>
      <h1>{question.title}</h1>
      <div className="quiz-options">
        {question.options.map((option) => (
          <button type="button" key={option.label} onClick={() => answer(option.value)}>
            <span>{option.label}</span><ArrowIcon />
          </button>
        ))}
      </div>
    </div>
  );
}
