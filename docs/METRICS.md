# Metrics and formulas

All outputs are planning illustrations over deterministic fictional data.

## Cash classes

| Metric | Definition | Confidence |
| --- | --- | --- |
| Operating cash | Fictional unrestricted cash available to the runway | High seeded confidence |
| Protected cash | Tax reserve plus health reserve | High seeded confidence |
| Cash floor | User-selected minimum acceptable operating balance | Scenario assumption |
| Lowest projected cash | Minimum weekly ending operating cash across 13 weeks | Modeled |

Protected cash never funds the operating runway.

## Income

Reliable income is modeled as biweekly net pay:

```text
biweekly reliable pay = reliable monthly net × 12 ÷ 26
```

Variable income is converted to weekly usable income:

```text
weekly variable gross = variable monthly gross × 12 ÷ 52
weekly usable variable = weekly variable gross × (1 − reserve rate)
```

The reserve rate is a planning assumption. It does not estimate tax liability.

## Obligations

Each recurring obligation has one due day and repeats monthly across the 13-week horizon. A fixed-cost adjustment is weeklyized:

```text
weekly adjustment = monthly fixed-cost adjustment ÷ (52 ÷ 12)
```

One-off events land in an explicitly seeded week. They are committed modeled events, not an uncertainty reserve.

## Thirteen-week runway

For week `w`:

```text
ending cash[w] = ending cash[w−1]
               + biweekly reliable pay when scheduled
               + weekly usable variable income
               − recurring obligations due in week w
               − weeklyized fixed-cost adjustment
               − weeklyized financing payment
               − flexible weekly cap
               − seeded one-off events in week w
```

The displayed weekly safe-to-spend cap is:

```text
selected cap + min(0, lowest projected cash − cash floor)
```

bounded between zero and the selected cap. This conservative heuristic reduces only week-one flexibility when the 13-week plan breaches the floor.

## Fixed-cost ratio

```text
fixed-cost ratio = monthly recurring obligations ÷ reliable monthly net income
```

Variable income is deliberately excluded from the denominator.

## Variable-income reserve

```text
reserve target = seeded year-to-date variable gross × selected reserve rate
reserve gap = max(0, reserve target − protected tax reserve)
```

## Financing calculation

If the origination fee is withheld from proceeds:

```text
financed amount = desired proceeds ÷ (1 − fee rate)
monthly rate = annual rate ÷ 12
monthly payment = P × r ÷ (1 − (1 + r)^−n)
total cash paid = monthly payment × n
total financing cost = total cash paid − desired proceeds
```

The quality gate contains five independent checks:

1. rate is fixed;
2. no prepayment penalty is indicated;
3. origination fee is at or below 3%;
4. monthly payment fits modeled payment room after a $650 operating buffer;
5. the 13-week low point preserves the selected cash floor.

Five passes produce `ready`; three or four produce `review`; zero to two produce `stop`.

## Net position

```text
net position = seeded assets − seeded liabilities
```

The trend is generated from aggregate seeded values. It is not an appraisal, investment statement, or credit report.
