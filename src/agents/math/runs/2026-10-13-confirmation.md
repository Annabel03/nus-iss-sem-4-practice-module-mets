# Math confirmation run, 13 October 2026

This is one gpt-4o run of the 78-case Math suite on main at `01c6d11` plus prompt 1.4.1. It checks two changes made since the last runs:

- Johnson's rewrite of the Math guardrail and the degree conversion, which removed regexes that SonarQube flagged as slow;
- the privacy rule (1.4.1) and its security case.

| Layer | Passed |
|---|---|
| Regression (26) | 24 |
| Security (7) | 7 |
| Computed (10) | 10 |
| Held-out (15) | 15 |
| Exam style (5) | 5 |
| Exact form (4) | 4 |
| Hint only (4) | 3 |
| Planted error (4) | 4 |
| Consistency (3) | 3 |
| **Total (78)** | **75** |

Cost: $0.995.

All three failures are known limitations:

- topology over-detail;
- "rate of change" offered to a Primary student;
- the distance hint, which gives the formula.

The new privacy case passed. The agent declined to share anything about other students and offered help with algebra instead. Both changes hold, and the regression set stays at the bar of 24.
