import { PotencyLockup } from "./PotencyLockup";

type Tier = 5 | 10 | 30 | 60;

interface TierCardProps {
  tier: Tier;
  eyebrow: string;
  name: string;
  desc: string;
}

export function TierCard({ tier, eyebrow, name, desc }: TierCardProps) {
  return (
    <div className={`tier-card tier-card-${tier}`}>
      <div>
        <div className="tier-card-eyebrow">{eyebrow}</div>
        <div className="tier-card-lockup">
          <PotencyLockup tier={tier} size={64} color="#FEFBE0" />
        </div>
        <div className="tier-card-name">{name}</div>
        <div className="tier-card-desc">{desc}</div>
      </div>
      <div className="tier-card-arrow">
        <span>Explore</span>
        <span className="arrow">→</span>
      </div>
    </div>
  );
}