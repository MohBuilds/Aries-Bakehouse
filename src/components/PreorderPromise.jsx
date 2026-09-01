import { Clock, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PreorderPromise() {
  return (
    <section className="preorder-promise-section" aria-labelledby="preorder-promise-title">
      <div className="container preorder-promise__inner">
        <div className="preorder-promise__card">
          <div className="preorder-promise__badge">
            <Clock size={16} aria-hidden="true" />
            <span>The 24-Hour Promise</span>
          </div>

          <h2 id="preorder-promise-title" className="preorder-promise__headline">
            Baked exclusively for you.<br />
            <em>Never sitting on a shelf.</em>
          </h2>

          <p className="preorder-promise__copy">
            At Aries 11 Bakehouse, every loaf, brownie box, pastry tray, and platter is made to order from scratch. 
            We require at least 24 hours between your order and fulfilment so our bakers can source fresh ingredients, 
            prove doughs to perfection, and bake in small batches in Abeokuta.
          </p>

          <div className="preorder-promise__pillars">
            <div className="preorder-promise__pillar">
              <div className="preorder-promise__pillar-icon">
                <Sparkles size={20} />
              </div>
              <div>
                <strong>Zero Pre-Baking</strong>
                <p>Ovens fire only when your order is placed.</p>
              </div>
            </div>

            <div className="preorder-promise__pillar">
              <div className="preorder-promise__pillar-icon">
                <ShieldCheck size={20} />
              </div>
              <div>
                <strong>Premium Ingredients</strong>
                <p>Pure butter, rich cocoa, real fruits, and quality nuts.</p>
              </div>
            </div>

            <div className="preorder-promise__pillar">
              <div className="preorder-promise__pillar-icon">
                <HeartHandshake size={20} />
              </div>
              <div>
                <strong>Abeokuta Kitchen</strong>
                <p>Handcrafted locally with warmth and precision.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
