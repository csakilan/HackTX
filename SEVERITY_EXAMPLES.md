# Engineer Message Severity Classification Examples

This document provides examples of engineer radio messages categorized by severity level. The Gemini AI model uses race telemetry and context to automatically classify messages into these categories.

---

## 🔴 HIGH SEVERITY (Immediate Delivery - 0 seconds)
*Critical messages that require immediate driver attention*

### Safety & Emergency
- "Box box box, brake failure detected"
- "Debris on track turn 3, take care"
- "Car behind is racing you hard, defend position"
- "Front wing damage detected, box this lap"
- "Tire puncture suspected, come in now"
- "Oil leak from car ahead, be careful"
- "Red flag, red flag, slow down immediately"

### Critical Race Strategy
- "Safety car deployed, box now for free stop"
- "Stay out, stay out, we're covering Hamilton"
- "Box opposite of Verstappen, we're going aggressive"
- "Pit entry closed, stay out"
- "We need this position, overtake now"

### Critical Mechanical Issues
- "Brake temperatures critical, manage cooling immediately"
- "Fuel critical, switch to mode 1 now"
- "DRS failure, you won't have DRS"
- "Gear 5 issue, avoid using it"

### Time-Critical Overtaking
- "Gap to Leclerc 0.5 seconds, DRS available next straight"
- "He's defending inside, go around the outside"
- "Sainz ahead is on old tires, push now"

---

## 🟠 MEDIUM SEVERITY (3 Second Delay)
*Important information that should be delivered soon but not immediately*

### Strategy Information
- "Planning to pit in 3 laps for mediums"
- "Target lap time 1:32 flat for next 5 laps"
- "Two-stop strategy, next stop lap 35"
- "We're extending this stint by 2 laps"
- "Gap to pit window opening in 4 laps"

### Performance Adjustments
- "Increase brake bias to plus 2"
- "Go to fuel mix 3 for these next laps"
- "Increase differential to 55%"
- "Reduce engine mode to conserve battery"
- "Front wing adjustment planned for next stop"

### Tire & Fuel Management
- "Tire temperatures climbing, manage pace"
- "You have 15 laps of fuel remaining"
- "Fronts are starting to grain, be gentle"
- "Target 2 seconds per lap fuel saving"
- "Rears are dropping off, consider pit soon"

### Gap Information
- "Gap to Perez behind 3.2 seconds"
- "You're closing on Russell, gap 4.5"
- "You've pulled 2 seconds on Norris"
- "Hamilton is 8 seconds ahead"

### Weather Updates
- "Rain expected in 10 minutes sector 2"
- "Track temperature rising, 45 degrees"
- "Wind shift, now headwind in main straight"

### Non-Critical Mechanical
- "Slight vibration detected, monitoring"
- "Battery levels good but not optimal"
- "Fronts warming up nicely now"

---

## 🟢 LOW SEVERITY (5-6 Second Delay)
*General information that can wait for optimal delivery timing*

### Race Position Updates
- "You're currently P5"
- "Running in the points, P8"
- "Three cars behind on different strategies"
- "Still in podium position"

### Lap Time Information
- "Last lap 1:32.5, decent pace"
- "That's purple sector 1"
- "Lap time consistent with target"
- "Personal best lap time that one"
- "You're matching the leaders pace"

### General Race Information
- "20 laps remaining in the race"
- "Halfway through the race"
- "Five laps completed, good start"
- "DRS trains forming behind"

### Motivational Messages
- "Keep pushing, great job"
- "Excellent tire management"
- "Perfect execution of the strategy"
- "Keep it clean, you're doing great"
- "Good pace, maintain this rhythm"

### Strategy Confirmation
- "Strategy confirmed for end of race"
- "Plan unchanged, staying out"
- "On target with fuel and tires"
- "Everything looking good from here"

### Non-Urgent Feedback
- "Turn 8 exit could be better"
- "Try carrying more speed through turn 4"
- "Good job managing traffic"
- "Smooth driving, keep it up"

### General Updates
- "Leaders are pulling away slightly"
- "Battle for P6 behind you is close"
- "Track evolution helping lap times"
- "Overall race pace is strong"

---

## Classification Logic

The Gemini AI considers these factors when classifying:

1. **Safety keywords**: "box now", "debris", "failure", "critical", "damage", "red flag"
2. **Urgency indicators**: "immediately", "now", "this lap", "DRS available"
3. **Telemetry context**: 
   - High brake/tire temps → upgrades severity of related messages
   - Low fuel → upgrades fuel-related messages
   - Close gaps → upgrades overtaking/defensive messages
   - Race position → podium positions get higher priority
4. **Race situation**:
   - Safety car deployment → HIGH
   - DRS zones → MEDIUM-HIGH for overtaking
   - Pit windows → MEDIUM
   - General updates → LOW

---

## Testing Examples

To test the system, try these engineer messages:

```
HIGH: "Box box box, front wing damage"
HIGH: "Debris on track turn 3"
HIGH: "Safety car, pit now"

MEDIUM: "Planning pit stop in 3 laps"
MEDIUM: "Switch to fuel mix 2"
MEDIUM: "Gap to car behind is 4 seconds"

LOW: "Great pace, keep it up"
LOW: "Currently P5 in the race"
LOW: "That was a purple sector"
```
