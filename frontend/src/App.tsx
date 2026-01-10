import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { config } from '@/config/wagmi';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { NetworkWarning } from '@/components/wallet/NetworkWarning';
import { VaultOverview } from '@/components/vault/VaultOverview';
import { UserPosition } from '@/components/vault/UserPosition';
import { DepositForm } from '@/components/vault/DepositForm';
import { WithdrawForm } from '@/components/vault/WithdrawForm';
import { OperatorPanel } from '@/components/operator/OperatorPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccount } from 'wagmi';
import { LandingPage } from '@/components/landing/LandingPage';

const queryClient = new QueryClient();

function VaultApp() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col bg-background"
    >
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-10">
        <NetworkWarning />

        {/* Page Title */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-bold tracking-tight">MantleYield Vault</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            ERC-4626 compliant composable vault for on-chain capital routing
          </p>
        </motion.div>

        {/* Overview Cards */}
        <div className="grid gap-6 lg:grid-cols-2 mb-10">
          <VaultOverview />
          <UserPosition />
        </div>

        {/* Action Panel */}
        <div className="mb-10">
          <Tabs defaultValue="deposit" className="w-full max-w-xl">
            <TabsList className="w-full mb-6 bg-muted/30 p-1 h-12">
              <TabsTrigger value="deposit" className="flex-1 h-10 data-[state=active]:bg-card data-[state=active]:shadow-sm">Deposit</TabsTrigger>
              <TabsTrigger value="withdraw" className="flex-1 h-10 data-[state=active]:bg-card data-[state=active]:shadow-sm">Withdraw</TabsTrigger>
            </TabsList>
            <TabsContent value="deposit">
              <DepositForm />
            </TabsContent>
            <TabsContent value="withdraw">
              <WithdrawForm />
            </TabsContent>
          </Tabs>
        </div>

        {/* Operator Panel (conditionally rendered based on role) */}
        <OperatorPanel />
      </main>

      <Footer />
      <Toaster />
    </motion.div>
  );
}

function AppContent() {
  const { isConnected } = useAccount();

  return (
    <AnimatePresence mode="wait">
      {!isConnected ? (
        <LandingPage key="landing" />
      ) : (
        <VaultApp key="app" />
      )}
    </AnimatePresence>
  );
}

const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
