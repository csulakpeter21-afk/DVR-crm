'use client';

/**
 * The call console: dialler plus script player (P1-06-T3, P1-07-T2).
 *
 * The whole published script version is passed in as a prop before the call
 * starts, so clicking an answer resolves the next node in memory. No fetch, no
 * await, no spinner: the next line is on screen in the same frame.
 *
 * Keyboard only works end to end. Answers are numbered 1 to 9, B books, and
 * Backspace steps back, because a rep on a call should never reach for a mouse.
 */
import {
  ScriptRuntime,
  renderLine,
  type ScriptNodeView,
  type ScriptVariables,
  type ScriptVersionView,
} from '@devora/script-engine';
import { Badge, Card, Eyebrow, LiveDot, buttonStyle } from '@devora/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { bookMeeting, endCall, recordAnswer, startCall } from '../lib/actions.ts';

interface Props {
  readonly leadId: string;
  readonly script: ScriptVersionView | null;
  readonly variables: ScriptVariables;
  readonly callable: boolean;
  readonly blockedReason: string | null;
  readonly recordingNoticeRequired: boolean;
  readonly phone: string | null;
}

type Phase = 'idle' | 'live' | 'ended';

interface PathStep {
  readonly nodeId: string;
  readonly label: string;
}

const elapsedLabel = (seconds: number): string =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export function CallConsole({
  leadId,
  script,
  variables,
  callable,
  blockedReason,
  recordingNoticeRequired,
  phone,
}: Props) {
  const runtime = useMemo(() => (script ? new ScriptRuntime(script) : null), [script]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [callId, setCallId] = useState<string | null>(null);
  const [node, setNode] = useState<ScriptNodeView | null>(null);
  const [history, setHistory] = useState<PathStep[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  /** Measured, so the 100 ms budget is visible rather than asserted. */
  const [lastResolveMs, setLastResolveMs] = useState<number | null>(null);
  const sequence = useRef(0);

  useEffect(() => {
    if (phase !== 'live') return undefined;
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [phase]);

  const begin = useCallback(async () => {
    setPending(true);
    const result = await startCall(leadId);
    setPending(false);
    if (!result.ok) {
      setNotice(result.message ?? 'The call was refused.');
      return;
    }
    setCallId(result.callId ?? null);
    setPhase('live');
    setSeconds(0);
    setNotice(
      recordingNoticeRequired
        ? 'Recording notice played and logged. Recording may now start.'
        : null,
    );
    if (runtime) {
      setNode(runtime.root);
      sequence.current = 0;
      if (result.callId) void recordAnswer(result.callId, runtime.root.id, null, 0);
    }
  }, [leadId, recordingNoticeRequired, runtime]);

  const choose = useCallback(
    (answerId: string, label: string) => {
      if (!runtime || !node) return;
      // The measurement that matters: answer in, next line out.
      const started = performance.now();
      const next = runtime.next(answerId);
      setLastResolveMs(performance.now() - started);

      setHistory((h) => [...h, { nodeId: node.id, label }]);
      if (next) setNode(next);

      sequence.current += 1;
      if (callId) void recordAnswer(callId, node.id, answerId, sequence.current);
    },
    [callId, node, runtime],
  );

  const stepBack = useCallback(() => {
    if (!runtime || history.length === 0) return;
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((h) => h.slice(0, -1));
    setNode(runtime.node(previous.nodeId));
  }, [history, runtime]);

  const finish = useCallback(
    async (decisionMakerReached: boolean, disposition: string) => {
      if (!callId) return;
      setPending(true);
      const result = await endCall(callId, {
        decisionMakerReached,
        disposition,
        durationSeconds: seconds,
      });
      setPending(false);
      setPhase('ended');
      setNotice(result.message ?? null);
    },
    [callId, seconds],
  );

  const book = useCallback(async () => {
    if (!callId) return;
    setPending(true);
    const result = await bookMeeting(leadId, callId);
    setPending(false);
    setNotice(result.message ?? null);
    if (result.ok) setPhase('ended');
  }, [callId, leadId]);

  // Keyboard: digits pick answers, B books, Backspace steps back.
  useEffect(() => {
    if (phase !== 'live' || !node) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
        return;
      if (event.key === 'Backspace') {
        event.preventDefault();
        stepBack();
        return;
      }
      if ((event.key === 'b' || event.key === 'B') && node.isBooking) {
        event.preventDefault();
        void book();
        return;
      }
      const index = Number(event.key) - 1;
      const answer = node.answers[index];
      if (answer) {
        event.preventDefault();
        choose(answer.id, answer.label);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [book, choose, node, phase, stepBack]);

  const rendered = node ? renderLine(node, variables) : null;

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--devora-space-4)',
          padding: 'var(--devora-space-4) var(--devora-space-5)',
          borderBottom: '1px solid var(--devora-border)',
          background: 'var(--devora-surface-sunken)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--devora-space-3)' }}>
          <Eyebrow>Call console</Eyebrow>
          {phase === 'live' ? (
            <Badge tone="critical">
              <LiveDot /> Live {elapsedLabel(seconds)}
            </Badge>
          ) : null}
          {script ? (
            <Badge
              tone="neutral"
              title="A published version is immutable, so this call stays on it"
            >
              Script v{script.version}
            </Badge>
          ) : null}
          {lastResolveMs !== null ? (
            <Badge tone="positive" title="Resolved in memory, no network round trip">
              Next line {lastResolveMs < 1 ? '<1' : lastResolveMs.toFixed(0)} ms
            </Badge>
          ) : null}
        </div>
        {phase === 'live' ? (
          <div style={{ display: 'flex', gap: 'var(--devora-space-2)' }}>
            <button
              type="button"
              style={buttonStyle('secondary', 'sm')}
              onClick={stepBack}
              disabled={history.length === 0}
            >
              Back
            </button>
            <button
              type="button"
              style={buttonStyle('danger', 'sm', pending)}
              onClick={() => void finish(true, 'conversation')}
            >
              End call
            </button>
          </div>
        ) : null}
      </div>

      <div style={{ padding: 'var(--devora-space-5)' }}>
        {phase === 'idle' ? (
          <div>
            {!callable ? (
              <div
                role="status"
                style={{
                  background: 'var(--devora-caution-soft)',
                  color: 'var(--devora-caution)',
                  border: '1px solid currentColor',
                  borderRadius: 'var(--devora-radius-sm)',
                  padding: 'var(--devora-space-3) var(--devora-space-4)',
                  marginBottom: 'var(--devora-space-4)',
                  fontSize: 'var(--devora-text-sm)',
                }}
              >
                <strong>Calling is blocked.</strong> {blockedReason}
              </div>
            ) : null}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--devora-space-4)',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                style={buttonStyle('primary', 'lg', !callable || pending)}
                onClick={() => void begin()}
                disabled={!callable || pending}
              >
                {pending ? 'Connecting' : `Call ${phone ?? 'contact'}`}
              </button>
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--devora-text-sm)',
                  color: 'var(--devora-ink-muted)',
                }}
              >
                {recordingNoticeRequired
                  ? 'The recording notice plays first and is logged before any recording starts.'
                  : 'No recording notice is required for this country.'}
              </p>
            </div>
          </div>
        ) : null}

        {phase === 'live' && node && rendered ? (
          <div>
            {notice ? (
              <p
                role="status"
                style={{
                  margin: '0 0 var(--devora-space-4)',
                  fontSize: 'var(--devora-text-xs)',
                  color: 'var(--devora-positive)',
                  background: 'var(--devora-positive-soft)',
                  padding: '0.375rem 0.5rem',
                  borderRadius: 'var(--devora-radius-sm)',
                }}
              >
                {notice}
              </p>
            ) : null}

            {node.intent ? <Eyebrow>{node.intent}</Eyebrow> : null}

            <p
              aria-live="polite"
              style={{
                fontFamily: 'var(--devora-font-serif)',
                fontSize: 'var(--devora-text-script)',
                lineHeight: 1.3,
                margin: 'var(--devora-space-2) 0 var(--devora-space-2)',
                color: 'var(--devora-ink)',
                maxWidth: '36ch',
              }}
            >
              {rendered.text}
            </p>

            {rendered.usedFallback ? (
              <p
                style={{
                  margin: '0 0 var(--devora-space-4)',
                  fontSize: 'var(--devora-text-xs)',
                  color: 'var(--devora-ink-muted)',
                }}
              >
                Fallback line: this lead has no sourced value for that variable.
              </p>
            ) : null}

            {node.answers.length > 0 ? (
              <>
                <p
                  style={{
                    margin: 'var(--devora-space-4) 0 var(--devora-space-2)',
                    fontSize: 'var(--devora-text-xs)',
                    color: 'var(--devora-ink-muted)',
                  }}
                >
                  What did they say?
                </p>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 'var(--devora-space-2)' }}
                >
                  {node.answers.map((answer, index) => (
                    <button
                      key={answer.id}
                      type="button"
                      onClick={() => {
                        choose(answer.id, answer.label);
                      }}
                      style={{
                        ...buttonStyle('secondary', 'md'),
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <kbd
                        style={{
                          fontFamily: 'var(--devora-font-mono)',
                          fontSize: 'var(--devora-text-xs)',
                          color: 'var(--devora-ink-muted)',
                          border: '1px solid var(--devora-border)',
                          borderRadius: 3,
                          padding: '0 0.3125rem',
                          marginRight: '0.125rem',
                        }}
                      >
                        {index + 1}
                      </kbd>
                      {answer.label}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {node.isBooking ? (
              <div
                style={{
                  marginTop: 'var(--devora-space-5)',
                  paddingTop: 'var(--devora-space-4)',
                  borderTop: '1px solid var(--devora-border)',
                }}
              >
                <button
                  type="button"
                  style={buttonStyle('primary', 'lg', pending)}
                  onClick={() => void book()}
                  disabled={pending}
                >
                  Book the qualifier meeting
                  <kbd
                    style={{
                      fontFamily: 'var(--devora-font-mono)',
                      fontSize: 'var(--devora-text-xs)',
                      opacity: 0.7,
                    }}
                  >
                    B
                  </kbd>
                </button>
              </div>
            ) : null}

            {node.outcome && node.answers.length === 0 ? (
              <div
                style={{
                  marginTop: 'var(--devora-space-5)',
                  display: 'flex',
                  gap: 'var(--devora-space-2)',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  style={buttonStyle('primary', 'md', pending)}
                  onClick={() => void finish(true, node.outcome ?? 'ended')}
                >
                  Log outcome: {node.outcome.replace(/_/gu, ' ')}
                </button>
                <button
                  type="button"
                  style={buttonStyle('secondary', 'md', pending)}
                  onClick={() => void finish(false, 'no_decision_maker')}
                >
                  Log as no decision maker
                </button>
              </div>
            ) : null}

            {history.length > 0 ? (
              <p
                style={{
                  marginTop: 'var(--devora-space-5)',
                  fontSize: 'var(--devora-text-xs)',
                  color: 'var(--devora-ink-faint)',
                }}
              >
                Path: {history.map((step) => step.label).join(' → ')}
              </p>
            ) : null}
          </div>
        ) : null}

        {phase === 'ended' ? (
          <div>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--devora-font-serif)',
                fontSize: 'var(--devora-text-lg)',
              }}
            >
              Call logged after {elapsedLabel(seconds)}.
            </p>
            {notice ? (
              <p
                style={{
                  margin: '0.5rem 0 0',
                  color: 'var(--devora-ink-secondary)',
                  fontSize: 'var(--devora-text-sm)',
                }}
              >
                {notice}
              </p>
            ) : null}
            <p
              style={{
                margin: 'var(--devora-space-4) 0 0',
                fontSize: 'var(--devora-text-xs)',
                color: 'var(--devora-ink-muted)',
              }}
            >
              The transition, the audit entry and the outbox event were written in one transaction.
            </p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
