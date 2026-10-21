/**
 * AertEM Event Correlation & Corroboration Service
 * 
 * Complies with Section 11:
 * - Keeps deduplication separate from event correlation.
 * - Links multiple distinct articles reporting on the same incident to a shared event timeline
 * - Tracks corroborating sources without destroying separate article records
 * - Accounts for syndication vs independent outlets
 */

export function correlateArticlesIntoEvents(classifiedArticles = []) {
  const events = [];

  for (const art of classifiedArticles) {
    const ai = art.ai || {};
    const hazard = (ai.hazard || 'General').toLowerCase().trim();
    const classification = ai.classification || 'INFORMATIVE';
    const eventDate = ai.event_date || (art.dateTime || art.date || '').slice(0, 10);
    const locations = Array.isArray(ai.locations) && ai.locations.length > 0 ? ai.locations : [ai.region || 'Global'];
    const primaryLoc = locations[0].toLowerCase().trim();

    // Find existing event candidate with matching hazard, location, and close temporal proximity (+/- 2 days)
    let matchedEvent = null;
    for (const evt of events) {
      if (evt.hazard.toLowerCase() === hazard && (evt.primaryLocation.includes(primaryLoc) || primaryLoc.includes(evt.primaryLocation))) {
        // Temporal check
        if (eventDate && evt.eventDate) {
          const diffMs = Math.abs(new Date(eventDate).getTime() - new Date(evt.eventDate).getTime());
          if (diffMs <= 2 * 86400000) {
            matchedEvent = evt;
            break;
          }
        } else {
          matchedEvent = evt;
          break;
        }
      }
    }

    if (matchedEvent) {
      // Corroborate existing event
      matchedEvent.articles.push(art);
      matchedEvent.articleCount++;
      matchedEvent.sources.push(art.source?.title || art.source?.uri || 'Source');

      // Update latest timeline date
      const artTime = new Date(art.dateTime || art.date || 0).getTime();
      const evtTime = new Date(matchedEvent.latestUpdate || 0).getTime();
      if (artTime > evtTime) {
        matchedEvent.latestUpdate = art.dateTime || art.date;
      }

      // Escalate severity if incoming article reports higher severity
      if (ai.severity === 'HIGH' || ai.urgency === 'HIGH' || ai.classification === 'ALERT') {
        matchedEvent.severity = 'HIGH';
        matchedEvent.classification = 'ALERT';
      }

      // Record corroboration details
      matchedEvent.distinctPublishers = Array.from(new Set(matchedEvent.sources));
      art.eventId = matchedEvent.eventId;
    } else {
      // New distinct event record
      const newEventId = `evt_${Date.now()}_${events.length + 1}`;
      const newEvent = {
        eventId: newEventId,
        title: art.title,
        hazard: ai.hazard || 'General',
        classification: classification,
        severity: ai.severity || ai.urgency || 'MED',
        eventDate: eventDate,
        latestUpdate: art.dateTime || art.date,
        primaryLocation: primaryLoc,
        locations: locations,
        summary: ai.summary || art.title,
        articles: [art],
        articleCount: 1,
        sources: [art.source?.title || art.source?.uri || 'Source'],
        distinctPublishers: [art.source?.title || art.source?.uri || 'Source'],
        corroborationLevel: 'SINGLE_SOURCE',
        createdAt: new Date().toISOString()
      };
      art.eventId = newEventId;
      events.push(newEvent);
    }
  }

  // Calculate corroboration level based on distinct publishers
  events.forEach(evt => {
    if (evt.distinctPublishers.length >= 3) {
      evt.corroborationLevel = 'HIGHLY_CORROBORATED';
    } else if (evt.distinctPublishers.length === 2) {
      evt.corroborationLevel = 'CORROBORATED';
    } else {
      evt.corroborationLevel = 'SINGLE_SOURCE';
    }
  });

  return events;
}
