import type { ComponentType, ReactNode } from "react"
import type { Metadata } from "next"
import { Github, Linkedin, Mail, Youtube } from "lucide-react"

export const metadata: Metadata = {
  title: "Hidden State Safety - Wiktor Tomasik",
  description: "Hidden state world models for LLM safety and control.",
}

const socialLinks: Array<{
  href: string
  label: string
  Icon: ComponentType<{ className?: string }>
  external?: boolean
}> = [
  { href: "https://www.linkedin.com/in/pixedar/", label: "LinkedIn", Icon: Linkedin, external: true },
  { href: "https://github.com/Pixedar", label: "GitHub", Icon: Github, external: true },
  { href: "mailto:pixedar@gmail.com", label: "Email", Icon: Mail },
  { href: "https://www.youtube.com/@pixedar", label: "YouTube", Icon: Youtube, external: true },
]

const figures = {
  sameWords: "/hidden-state-safety/same-words-different-future.png",
  actionCoupling: "/hidden-state-safety/coordinate-action-effect.png",
  worldModel: "/hidden-state-safety/world-model-audit.png",
}

function SocialIcon({
  href,
  label,
  Icon,
  external,
}: {
  href: string
  label: string
  Icon: ComponentType<{ className?: string }>
  external?: boolean
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={label}
      title={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-[#1F2420]/15 bg-white/55 text-[#1F2420] shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
    >
      <Icon className="h-5 w-5" />
    </a>
  )
}

function SectionTitle({ eyebrow, children }: { eyebrow?: string; children: ReactNode }) {
  return (
    <div className="mx-auto mb-8 w-full max-w-[calc(100vw_-_2.5rem)] text-center md:max-w-3xl">
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#8E5B37]">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-normal text-[#1F2420] md:text-4xl">{children}</h2>
    </div>
  )
}

function Figure({
  src,
  alt,
  children,
}: {
  src: string
  alt: string
  children: ReactNode
}) {
  return (
    <figure className="mx-auto my-12 w-full max-w-[calc(100vw_-_2.5rem)] md:max-w-4xl">
      <div className="overflow-hidden rounded-lg border border-[#20251F]/10 bg-white p-3 shadow-[0_22px_70px_rgba(31,36,32,0.11)]">
        <img src={src} alt={alt} className="mx-auto block h-auto max-w-full rounded-md" />
      </div>
      <figcaption className="mx-auto mt-5 w-full max-w-[calc(100vw_-_2.5rem)] text-sm leading-7 text-[#5F635D] md:max-w-3xl">{children}</figcaption>
    </figure>
  )
}

export default function HiddenStateSafetyPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F7F4EE] text-[#252922]">
      <div className="pointer-events-none fixed inset-0 opacity-[0.04]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(#1F2420 1px, transparent 1px), linear-gradient(90deg, #1F2420 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <article className="relative mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <header className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            {socialLinks.map((item) => (
              <SocialIcon key={item.label} {...item} />
            ))}
          </div>

          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.32em] text-[#8E5B37]">Hidden State Safety</p>
          <h1 className="max-w-4xl text-3xl font-semibold leading-tight tracking-normal text-[#151814] sm:text-5xl md:text-7xl">
            <span className="block">Hidden state world</span>
            <span className="block">models for LLM</span>
            <span className="block">safety</span>
          </h1>
          <p className="mt-6 text-base text-[#6C716A] md:text-lg">Wiktor Tomasik · June 8, 2026</p>
        </header>

        <section className="mx-auto mt-16 w-full max-w-[calc(100vw_-_2.5rem)] md:max-w-3xl">
          <SectionTitle eyebrow="The idea">Hidden state world models</SectionTitle>

          <div className="w-full space-y-7 text-[1.08rem] leading-8 text-[#30352E] md:text-[1.16rem] md:leading-9">
            <p>There is a very subtle but deep difference between learning and understanding.</p>

            <p>Where an LLM works very well as a next token predictor, it might struggle to <strong className="font-semibold text-[#171A16]">predict the consequences</strong> of its actions.</p>

            <p>A purely generative model knows what a highly coherent, appropriate answer looks like. For a very simple example: if a user confidently tells an LLM that its perfectly correct answer is wrong, the model will often immediately apologize and change its stance. Why? Because it is just predicting the next most likely words. In its training data, when a human corrects an assistant, a polite apology usually comes next.</p>

            <p>The danger here is not that we want AI models to be rude, argumentative, or yell at users. The danger is that this dynamic makes the model structurally vulnerable to manipulation.</p>

            <p>This simple example might already be solved by current methods, but if a malicious user slowly weaves a complex hypothetical that shifts the moral or logical baseline, the model just continues mapping its next polite response to the user&apos;s localized framing. It easily loses track of the boundary between &quot;what is actually true&quot; and &quot;the premise the user is manipulating me into adopting.&quot; It generates the text based on the most probable statistical patterns, but it cannot predict the social consequences of surrendering that epistemic ground beforehand.</p>

            <p>
              The information needed for such prediction might not be accessible simply from generated text alone. The textual answer might look identical, but the reason might differ: one can be answering with the model&apos;s factual knowledge, and the other can be adopting the user&apos;s worldview that is not aligned with the model&apos;s factual knowledge. The closest example of that might be this{" "}
              <a href="https://arxiv.org/abs/2505.09807" target="_blank" rel="noopener noreferrer" className="text-[#8E4A25] underline decoration-[#C58A65]/60 underline-offset-4 hover:text-[#5F3018]">
                truth directions work
              </a>
              . However, work like{" "}
              <a href="https://arxiv.org/abs/2407.03282" target="_blank" rel="noopener noreferrer" className="text-[#8E4A25] underline decoration-[#C58A65]/60 underline-offset-4 hover:text-[#5F3018]">
                hallucination probes
              </a>{" "}
              also shares this idea of hidden information.
            </p>

            <p>We can attempt to actively steer the LLM based on these signals or forcefully end the conversation. However, just knowing that the LLM is currently in a state prone to hallucination doesn&apos;t tell us how we should change its behavior. For example, the LLM might currently be asked to imagine a fantasy fairytale.</p>

            <p>The danger is not when the model is inventing fictional characters in a fairytale. The real danger begins when medical or legal advice becomes a fairytale because of user pressure or manipulation. In this scenario, the dangerous consequence is precisely the transition: the model is in a high trust medical advice context, but is being pushed into an internal state highly prone to hallucination. If we do not steer the model away or end it, it breaches that epistemic boundary.</p>

            <p>There is a very subtle, important thing here, being that the dangerous state is not that the text would be inappropriate for the user. But rather, the relation between the generated text and the model&apos;s hidden state might yield dangerous consequences for the user.</p>

            <p>This is the difference between generating text trained by a reward signal based on human feedback and predicting the consequences of its action.</p>

            <p>OK, but how can we know which hidden signals would be useful for it? Do we need to measure how aligned its response is with its own factual knowledge, or maybe it is better to use uncertainty or how likely the model is to hallucinate in the current state? Are these all the signals we can use? Which signal should we use for what context, and how do they relate to dangerous behavior?</p>

            <p>On top of that my preliminary test reults indicated that even when a hidden state feture is correlated with some behvaior steering it can make opposite result.</p>

            <p>Is there some more general approach we can use to build such a controller?</p>

            <p>It might be this:</p>

            <p>
              There is now an emerging trend in robotics around{" "}
              <a href="https://arxiv.org/abs/2506.09985" target="_blank" rel="noopener noreferrer" className="text-[#8E4A25] underline decoration-[#C58A65]/60 underline-offset-4 hover:text-[#5F3018]">
                world models
              </a>{" "}
              in{" "}
              <a href="https://arxiv.org/abs/2301.08243" target="_blank" rel="noopener noreferrer" className="text-[#8E4A25] underline decoration-[#C58A65]/60 underline-offset-4 hover:text-[#5F3018]">
                JEPA like approaches
              </a>
              . The core insight of these approaches is that generalizing patterns is not the same as tracking the state of the environment. Normally, the system makes its movement based on what patterns it sees in the image; it can generalize, but it does not care about the laws of motion or the state of the environment. It only cares about mapping between visual patterns and correct arm movement.
            </p>

            <p>A JEPA like world model is also a predictive engine, but it predicts in a fundamentally different way: it predicts how the state of the room/environment will change if it takes a certain action. It learns this precisely because we teach it to predict the consequences of its actions.</p>

            <p>
              A true world model naturally discovers a{" "}
              <a href="https://media.licdn.com/dms/document/media/v2/D561FAQFhxUrGrq1nuw/feedshare-document-pdf-analyzed/B56Z6S2jb8JoAc-/0/1780580237936?e=1781740800&v=beta&t=M-B3jcC8IVZLYf8_UwFjRnanzp69v-oB4p8qYVgAfq4" target="_blank" rel="noopener noreferrer" className="text-[#8E4A25] underline decoration-[#C58A65]/60 underline-offset-4 hover:text-[#5F3018]">
                stable internal map
              </a>
              , a coordinate system that makes the underlying mechanics of an environment useful for control. For example, in a physical environment, this coordinate system might track things like the laws of motion, gravity, and momentum. It then applies these laws to predict the consequences of its action.
            </p>

            <p>It is like in the case of robotics, where the world model knows the laws of motion and uses them to predict that if it does not move its arm, the bottle will fall off the table. It is fundamentally different than copying known arm movements based on visual input.</p>

            <p>For a world model in the context of this social/moral environment, it might be a set of relations between the hidden internal states of the LLM and the text it produces.</p>

            <p>The hope is that, by predicting the consequences of its actions, we discover the right set of hidden activation patterns that will help us predict what kind of action we should take in a given context.</p>

            <p>
              Also, in addition, we can train a world model controller in a way that applies a minimal amount of steering that will steer the model away from bad situations; because this is proactive, we can minimize the amount of steering needed.
            </p>

            <p>
              Another advantage is that current LLMs are shaped by reward models to behave safely. Research on{" "}
              <a href="https://arxiv.org/abs/2210.10760" target="_blank" rel="noopener noreferrer" className="text-[#8E4A25] underline decoration-[#C58A65]/60 underline-offset-4 hover:text-[#5F3018]">
                reward model overoptimization
              </a>{" "}
              found that when a policy is optimized too strongly against a learned reward model, the reward score can keep improving while the underlying judged quality gets worse. In this context, this means the model can learn to satisfy the proxy rather than the thing we actually care about. Human judgment is not a one dimensional scalar reward. It might contain thing like truthfulness, helpfulness, harmlessness, social context, uncertainty, moral consequences, user intent, and manipulation risk all at once. Compressing this into a single reward score can teach the model to make the surface text look safe without giving it a stable causal model of ownership, evidence, commitment, pressure, and permissible action.
            </p>
          </div>
        </section>

        <section className="mx-auto mt-24 w-full border-t border-[#1F2420]/10 pt-16">
          <SectionTitle eyebrow="Basic tests">What I already did</SectionTitle>

          <div className="mx-auto w-full max-w-[calc(100vw_-_2.5rem)] space-y-7 text-[1.04rem] leading-8 text-[#343932] md:max-w-3xl md:text-[1.1rem] md:leading-9">
            <p>I tested this idea on Qwen2.5 Instruct models, from 0.5B to 14B, and then did the additional audits on Qwen2.5 7B and 14B on a Vast.ai RTX PRO 5000 Blackwell 48GB GPU. Most runs used greedy decoding, temperature 0.0, bf16, and residual stream reads from middle layers. For read tests I used AUC, where 0.5 is chance. For action tests I used forced logprob gaps, so the result is measured before a free form answer is sampled.</p>

            <p className="rounded-lg border border-[#B86A5F]/20 bg-[#F7ECE8] px-4 py-4 text-[#8A3F37]">These are only basic tests. They still need proper validation, larger samples, and statistical significance testing, so they should not be interpreted as hard truth.</p>
          </div>

          <div className="mx-auto mt-14 w-full max-w-[calc(100vw_-_2.5rem)] md:max-w-3xl">
            <h3 className="text-2xl font-semibold tracking-normal text-[#1F2420] md:text-3xl">1. Testing the same answer text across different situations</h3>
          </div>

          <div className="mx-auto mt-7 w-full max-w-[calc(100vw_-_2.5rem)] space-y-7 text-[1.04rem] leading-8 text-[#343932] md:max-w-3xl md:text-[1.1rem] md:leading-9">
            <p>First I forced the model to give the same answer text in two different situations. In one case the answer followed reliable evidence. In the other case the same answer followed pressure or social framing.</p>

            <p>To make this less dependent on the surface answer alone, I used several controls: the assistant answer was byte identical, the test used held out and paraphrased contexts, and I compared the hidden read with shuffled label nulls and text only baselines. This still does not make it a full causal controller test. It was mainly a scaling test: when the same visible answer is produced from different epistemic situations, does the internal trajectory become more predictive of later behavior as the model gets larger?</p>

            <p>I measured whether hidden activations during the identical forced answer predicted whether the model later kept the answer or flipped under correction. The result scaled: the read became strong at 3B, 7B, and 14B, and the higher N 7B run was also strong. The 1.5B model was the only tested scale where this read got worse.</p>

            <p>This is why I then did a more direct truth directions style test: build matched contrast pairs, learn a direction from the difference between their internal activations, add or subtract that direction while the model is producing the forced answer, and measure whether this changes which later continuation the model treats as more likely.</p>
          </div>

          <Figure src={figures.sameWords} alt="Same answer text across different situations">
            The answer text is held fixed, then hidden activations are tested for whether they predict later flip or stability. AUC=0.5 is chance. The shuffled null is the same test after randomly permuting later outcomes; it controls label overfitting. The important result is that the same visible answer can leave a different future liability.
          </Figure>

          <div className="mx-auto w-full max-w-[calc(100vw_-_2.5rem)] space-y-7 text-[1.04rem] leading-8 text-[#343932] md:max-w-3xl md:text-[1.1rem] md:leading-9">
            <p>I also tested a related version of the same point: if we train a feature space to predict future behavior, does that feature space preserve the structure needed for steering? I compared interpretable contrast axes with a learned encoder. The learned encoder predicted later behavior better in these small model runs, but the separate structure audit showed that its composition score was almost identical to its null and it lost the known steering variables.</p>

            <p>This is the first bridge to the main idea. The sentence is not the whole action. In a social/moral environment, the action also includes the internal state from which the sentence was produced and the future state it makes more likely. A feature space can predict the future while losing the structure needed to choose the right steering action.</p>
          </div>

          <Figure src={figures.worldModel} alt="Coordinate audit showing later behavior prediction">
            The plot shows only later behavior prediction. Bars are mean AUC over the 0.5B and 1.5B coordinate audit runs; whiskers show the two run range, and gray marks show the shuffle null. The learned encoder predicts better here, but the structure audit behind the same run showed it was not yet a control ready coordinate.
          </Figure>

          <div className="mx-auto mt-16 w-full max-w-[calc(100vw_-_2.5rem)] md:max-w-3xl">
            <h3 className="text-2xl font-semibold tracking-normal text-[#1F2420] md:text-3xl">2. Testing which readable coordinates change later action</h3>
          </div>

          <div className="mx-auto mt-7 w-full max-w-[calc(100vw_-_2.5rem)] space-y-7 text-[1.04rem] leading-8 text-[#343932] md:max-w-3xl md:text-[1.1rem] md:leading-9">
            <p>The second test asked a different question. The first test only reads the hidden state and asks whether it predicts later behavior. In this test I intervened on the hidden activations: during the same forced answer, I added a small vector for a chosen coordinate, then measured whether the model later became more likely to stand by, recant, follow a constraint, or violate it.</p>

            <p>Here a hidden coordinate means a direction trained from contrast pairs, for example evidence present versus evidence absent, or ownership present versus ownership absent. An action gap means the logprob difference between two fixed continuations: keeping the earlier answer versus recanting it, or following a constraint versus violating it. If the gap moves when I steer a coordinate, then the coordinate is not only readable; it is coupled to behavior.</p>

            <p>I trained five directions: evidence, pressure, ownership, constraint present, and compliance pressure. Then, in the test phase, I held the visible transcript fixed. Same user text, same forced answer, same later challenge, same scored continuations. Only the hidden trajectory changed: I steered along the positive coordinate, the negative coordinate, or a random direction.</p>

            <p>All five coordinates were readable on held out items. Their read AUC was at least 0.996. But this did not mean they were equally useful for control.</p>
          </div>

          <Figure src={figures.actionCoupling} alt="Action effect of readable hidden coordinates">
            All five hidden coordinates were readable, so the plot shows only the action effect. The visible text was unchanged across interventions. Evidence and ownership strongly moved the stand by vs recant gap, but in the opposite direction from the naive story: adding the positive evidence/ownership direction reduced standing by the answer under challenge. Compliance pressure was the clearest action coupled coordinate for the permissible vs impermissible action gap. Pressure was readable but weak as an action handle.
          </Figure>

          <div className="mx-auto w-full max-w-[calc(100vw_-_2.5rem)] space-y-7 text-[1.04rem] leading-8 text-[#343932] md:max-w-3xl md:text-[1.1rem] md:leading-9">
            <p>This was the most important result for the world model idea. A probe can tell us that the model is in some hidden state, but that does not tell us what intervention to apply. Even when a coordinate is action coupled, the sign can be non obvious. Evidence may mean &quot;update when new evidence arrives,&quot; not &quot;defend the previous answer.&quot; Ownership may mean accountability, not stubbornness.</p>

            <p>This links the first two results. The first test says that hidden state can help predict the future. The second test says prediction is not enough for control. A coordinate that is easy to read can still be the wrong handle to push, or can push in the opposite direction from the naive interpretation. So a controller cannot simply say: if the truth probe is high, do X; if the pressure probe is high, do Y. It needs a model that translates detected signals into the correct intervention for the current situation.</p>
          </div>

          <div className="mx-auto mt-16 w-full max-w-[calc(100vw_-_2.5rem)] md:max-w-3xl">
            <h3 className="text-2xl font-semibold tracking-normal text-[#1F2420] md:text-3xl">3. Testing how to steer without degrading unrelated behavior</h3>
          </div>

          <div className="mx-auto mt-7 w-full max-w-[calc(100vw_-_2.5rem)] space-y-7 text-[1.04rem] leading-8 text-[#343932] md:max-w-3xl md:text-[1.1rem] md:leading-9">
            <p>I also tested the implementation question: if a hidden signal is useful, what is the right mechanism for using it without damaging the rest of the model?</p>

            <p>The simplest version is to train a linear probe and then push the model along that probe direction. A linear probe is just a small classifier that reads a feature from hidden activations. This is not the same thing as a controller. It tells us that a state is readable, but it does not train the geometry of what should change and what must stay fixed.</p>

            <p>In the repo this distinction mattered. The useful mechanism was closer to a learned receptor or wire: a separate actuator trained to translate a control state into a small hidden modulation, while neutral KL, key retention, and held out checks constrain what must not move. KL here means the steered model&apos;s next token distribution should stay close to the unsteered model on neutral prompts. Retention means the intervention should preserve important facts and unrelated behavior, not merely produce a safer looking refusal.</p>

            <p>The steering runs gave a narrower but useful result. Broad steering could still create canned abstention, overcorrection, or loss of unrelated behavior. The defensible result is architectural: monitor and actuator should be separated, and the actuator must be trained with anchors for the parts of the model&apos;s behavior that should remain unchanged.</p>
          </div>

          <figure className="mx-auto my-12 w-full max-w-[calc(100vw_-_2.5rem)] md:max-w-4xl">
            <div className="rounded-lg border border-[#20251F]/10 bg-[#FBFAF6] p-5 shadow-[0_18px_55px_rgba(31,36,32,0.08)] md:p-7">
              <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.22em] text-[#8E5B37]">Architecture difference</p>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-md border border-[#1F2420]/10 bg-white px-4 py-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8A4F42]">Raw probe push</p>
                  <div className="mt-5 space-y-3 text-sm leading-6 text-[#343932]">
                    <div className="rounded-md bg-[#F8EFEA] px-3 py-3">linear probe reads a hidden feature</div>
                    <div className="text-center text-[#8A8F86]">-&gt;</div>
                    <div className="rounded-md bg-[#F8EFEA] px-3 py-3">the read direction is reused as the actuator</div>
                    <div className="text-center text-[#8A8F86]">-&gt;</div>
                    <div className="rounded-md bg-[#F8EFEA] px-3 py-3">no KL or key retention objective defines what must stay fixed</div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#626760]">This can prove that a coordinate is readable, but it does not train a selective control mechanism.</p>
                </div>

                <div className="rounded-md border border-[#2D8B75]/20 bg-[#F1F7F1] px-4 py-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#4F6D5A]">Anchored receptor / wire</p>
                  <div className="mt-5 space-y-3 text-sm leading-6 text-[#343932]">
                    <div className="rounded-md bg-white px-3 py-3">paired states expose target and retention geometry</div>
                    <div className="text-center text-[#8A8F86]">-&gt;</div>
                    <div className="rounded-md bg-white px-3 py-3">learned receptor maps control state to layer local modulation</div>
                    <div className="text-center text-[#8A8F86]">-&gt;</div>
                    <div className="rounded-md bg-white px-3 py-3">neutral KL, key retention, and held out truth checks anchor behavior</div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#626760]">This separates monitor from actuator. The reader decides whether to act; the receptor defines how the model may move.</p>
                </div>
              </div>
            </div>
            <figcaption className="mx-auto mt-5 w-full max-w-[calc(100vw_-_2.5rem)] text-sm leading-7 text-[#5F635D] md:max-w-3xl">The practical lesson was architectural. A readable direction is a monitor. A receptor or wire is an actuator trained with anchors for what should not change. The current actuator is still narrow: it works best as a local, low gain nudge when the desired basin is nearby, not as a general repair.</figcaption>
          </figure>

          <div className="mx-auto w-full max-w-[calc(100vw_-_2.5rem)] space-y-7 text-[1.04rem] leading-8 text-[#343932] md:max-w-3xl md:text-[1.1rem] md:leading-9">
            <p>The current receptor results are narrow but informative. They suggest the right next actuator is not a stronger raw direction, but a trained control port with paired frame data, key retention, neutral KL, and pressure tests. In world model terms, this is the difference between reading a coordinate and learning the allowed transition inside that coordinate.</p>
          </div>
        </section>
      </article>
    </main>
  )
}
