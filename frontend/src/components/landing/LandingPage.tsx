import { useConnect } from 'wagmi';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Check, X, Shield, Zap, Blocks, Network, Lock, Eye, Scale, RefreshCcw, Mail, Send, Users } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } }
};

export function LandingPage() {
  const { connect, connectors, isPending } = useConnect();

  const handleLaunchApp = () => {
    connect({ connector: connectors[0] });
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 pattern-dots opacity-30" />
        
        <div className="container mx-auto px-4 py-20 relative">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="lg:col-span-6 space-y-8 z-10"
            >
              <motion.div variants={fadeInUp}>
                <h1 className="text-display">
                  <span className="block text-foreground">MANTLE</span>
                  <span className="block text-gradient-primary">YIELD</span>
                </h1>
              </motion.div>

              <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-muted-foreground max-w-lg leading-relaxed">
                Composable ERC-4626 Vault for On-Chain Capital Routing
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
                <div className="geo-block geo-block-teal px-5 py-2.5 text-sm font-semibold rounded-xl">
                  ERC-4626 Standard
                </div>
                <div className="geo-block geo-block-purple px-5 py-2.5 text-sm font-semibold rounded-xl">
                  No APY Promises
                </div>
                <div className="geo-block geo-block-coral px-5 py-2.5 text-sm font-semibold rounded-xl">
                  Always Withdrawable
                </div>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Button
                  onClick={handleLaunchApp}
                  disabled={isPending}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-10 py-7 text-lg rounded-2xl group glow-primary"
                >
                  {isPending ? 'Connecting...' : 'Launch App'}
                  <ArrowUpRight className="ml-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Right: Geometric Visual */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="lg:col-span-6 relative h-[500px] hidden lg:block"
            >
              {/* Large teal circle */}
              <motion.div 
                variants={scaleIn}
                className="absolute top-0 right-0 w-56 h-56 geo-block geo-block-teal geo-circle animate-float glow-primary"
              />
              
              {/* Purple rectangle */}
              <motion.div 
                variants={scaleIn}
                className="absolute top-24 right-40 w-72 h-72 geo-block geo-block-purple rounded-3xl rotate-12 animate-float-delayed"
              />
              
              {/* Coral rectangle */}
              <motion.div 
                variants={scaleIn}
                className="absolute bottom-16 right-8 w-44 h-44 geo-block geo-block-coral rounded-2xl -rotate-6"
              />
              
              {/* Yellow circle */}
              <motion.div 
                variants={scaleIn}
                className="absolute bottom-8 right-56 w-36 h-36 geo-block geo-block-yellow geo-circle glow-warm"
              />
              
              {/* Pink square */}
              <motion.div 
                variants={scaleIn}
                className="absolute top-48 right-80 w-28 h-28 geo-block geo-block-pink rounded-xl rotate-45"
              />

              {/* Small teal accent */}
              <motion.div 
                variants={scaleIn}
                className="absolute top-8 right-72 w-16 h-16 geo-block geo-block-teal rounded-lg"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-6"
          >
            <motion.div variants={fadeInUp} className="system-block hover-lift">
              <h2 className="text-headline mb-6">The Problem</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Most yield products tightly couple capital custody, strategy logic, and UX, 
                making safety and exits difficult to reason about.
              </p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="geo-block geo-block-teal p-8 rounded-3xl hover-lift">
              <h3 className="text-title mb-4">Our Solution</h3>
              <p className="opacity-90 leading-relaxed text-lg">
                MantleYield separates custody, routing, and strategy execution 
                at the infrastructure layer.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* What MantleYield Is / Is Not */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* IS Block */}
            <motion.div
              variants={fadeInUp}
              className="geo-block geo-block-teal p-10 rounded-3xl hover-lift"
            >
              <div className="flex items-center gap-3 mb-8">
                <Check className="w-8 h-8" />
                <h3 className="text-headline">IS</h3>
              </div>
              <ul className="space-y-5">
                {[
                  "ERC-4626 compliant vault",
                  "Strategy-agnostic capital router",
                  "Operator-driven execution",
                  "Fully on-chain accounting"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-lg font-medium">
                    <div className="w-3 h-3 bg-primary-foreground rounded-full flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* IS NOT Block */}
            <motion.div
              variants={fadeInUp}
              className="geo-block geo-block-coral p-10 rounded-3xl hover-lift"
            >
              <div className="flex items-center gap-3 mb-8">
                <X className="w-8 h-8" />
                <h3 className="text-headline">IS NOT</h3>
              </div>
              <ul className="space-y-5">
                {[
                  "Yield farm",
                  "APY optimizer",
                  "Incentive protocol",
                  "Simulated DeFi demo"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-lg font-medium">
                    <div className="w-3 h-3 bg-accent-foreground rounded-full flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 pattern-grid opacity-20" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="text-headline text-center mb-16">
              Architecture
            </motion.h2>

            <div className="max-w-lg mx-auto space-y-4">
              {[
                { label: "User", color: "geo-block-pink", icon: Users },
                { label: "ERC-4626 Vault", color: "geo-block-teal", icon: Blocks, main: true },
                { label: "Strategy Adapters", color: "geo-block-purple", icon: Network },
                { label: "Underlying Protocols", color: "geo-block-coral", icon: Zap }
              ].map((item, i) => (
                <motion.div key={item.label} variants={fadeInUp}>
                  <div className={`geo-block ${item.color} p-6 rounded-2xl hover-scale cursor-default ${item.main ? 'glow-primary' : ''}`}>
                    <div className="flex items-center gap-4">
                      <item.icon className="w-6 h-6" />
                      <span className="text-title">{item.label}</span>
                    </div>
                  </div>
                  {i < 3 && (
                    <div className="h-4 flex justify-center">
                      <div className="w-0.5 h-full bg-border" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <motion.div variants={fadeInUp} className="mt-16 grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                "Vault handles custody and accounting",
                "Strategies are modular and replaceable",
                "Capital movement is explicit"
              ].map((text, i) => (
                <div key={i} className="system-block text-center text-sm text-muted-foreground">
                  {text}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Why Mantle */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="text-headline text-center mb-16">
              Why This Fits Mantle
            </motion.h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {[
                { text: "Infrastructure-first DeFi primitive", color: "geo-block-teal" },
                { text: "Modular by design", color: "geo-block-purple" },
                { text: "Cheap, predictable execution", color: "geo-block-coral" },
                { text: "Avoids incentive-driven capital distortion", color: "geo-block-yellow" },
                { text: "Aligns with Mantle's rollup economics", color: "geo-block-pink" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className={`geo-block ${item.color} p-6 rounded-2xl hover-lift`}
                >
                  <p className="text-lg font-semibold">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Safety */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <Shield className="inline-block w-12 h-12 text-primary mb-4" />
              <h2 className="text-headline">Safety & Invariants</h2>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {[
                { icon: Lock, text: "Withdrawals are never blocked" },
                { icon: Eye, text: "All balances are on-chain verifiable" },
                { icon: Scale, text: "Allocation caps limit risk" },
                { icon: RefreshCcw, text: "Rebalance preserves accounting invariants" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className="system-block hover-lift"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 geo-block geo-block-teal rounded-xl flex items-center justify-center">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <p className="text-lg font-medium">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Project Status */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-10" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="text-headline text-center mb-16">
              Project Status
            </motion.h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {[
                { label: "Smart Contracts", status: "Completed & Deployed", color: "geo-block-teal" },
                { label: "Frontend", status: "Functional MVP", color: "geo-block-purple" },
                { label: "Strategies", status: "Idle + Extensible", color: "geo-block-coral" },
                { label: "Governance", status: "Not Included (by design)", color: "geo-block-dark" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className={`geo-block ${item.color} p-6 rounded-2xl`}
                >
                  <p className="font-bold mb-2">{item.label}</p>
                  <p className="text-sm opacity-80">{item.status}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-headline mb-2">Team</h2>
              <p className="text-muted-foreground text-lg">HackOn Team Vietnam</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {[
                { name: "Bernie Nguyen", role: "Architect / Tech Lead", color: "geo-block-teal" },
                { name: "Thien Vo", role: "Frontend Developer", color: "geo-block-purple" },
                { name: "Canh Trinh", role: "Smart Contract Developer", color: "geo-block-coral" },
                { name: "Hieu Tran", role: "Business Developer", color: "geo-block-yellow" }
              ].map((member, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className={`geo-block ${member.color} p-6 rounded-2xl text-center hover-lift`}
                >
                  <div className="w-16 h-16 mx-auto mb-4 geo-block geo-block-dark geo-circle flex items-center justify-center text-2xl font-bold">
                    {member.name.charAt(0)}
                  </div>
                  <p className="font-bold">{member.name}</p>
                  <p className="text-sm opacity-80">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-2xl mx-auto"
          >
            <motion.h2 variants={fadeInUp} className="text-headline text-center mb-12">
              Contact
            </motion.h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <motion.a
                href="mailto:bernie.web3@gmail.com"
                variants={fadeInUp}
                className="system-block hover-lift flex items-center gap-4"
              >
                <Mail className="w-6 h-6 text-primary" />
                <span>bernie.web3@gmail.com</span>
              </motion.a>

              <motion.a
                href="https://t.me/hackonteam"
                target="_blank"
                rel="noopener noreferrer"
                variants={fadeInUp}
                className="system-block hover-lift flex items-center gap-4"
              >
                <Send className="w-6 h-6 text-primary" />
                <span>@hackonteam</span>
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="geo-block geo-block-purple p-12 md:p-20 rounded-3xl text-center relative overflow-hidden"
          >
            {/* Decorative shapes */}
            <div className="absolute top-0 right-0 w-32 h-32 geo-block geo-block-teal geo-circle opacity-50 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 geo-block geo-block-coral rounded-2xl opacity-50 translate-y-1/2 -translate-x-1/2 rotate-12" />
            
            <motion.h2 variants={fadeInUp} className="text-headline mb-6 relative">
              Enter the on-chain interface
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl opacity-80 mb-10 max-w-2xl mx-auto relative">
              Infrastructure-grade ERC-4626 vault. No promises. Just primitives.
            </motion.p>
            <motion.div variants={fadeInUp} className="relative">
              <Button
                onClick={handleLaunchApp}
                disabled={isPending}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-12 py-7 text-xl rounded-2xl group glow-primary"
              >
                {isPending ? 'Connecting...' : 'Launch App'}
                <ArrowUpRight className="ml-2 h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 MantleYield · HackOn Team Vietnam</p>
        </div>
      </footer>
    </div>
  );
}
