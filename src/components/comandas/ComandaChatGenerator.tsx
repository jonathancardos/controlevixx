import { Label } from '@/components/ui/label'; // Add this import

// ... (rest of imports)

// Define placeholders as a string variable
const placeholdersText = "Placeholders disponíveis: \\{\\{cliente\\}\\}, \\{\\{orderNumber\\}\\}, \\{\\{data\\}\\}, \\{\\{serviceType\\}\\}, \\{\\{address\\}\\}, \\{\\{reference\\}\\}, \\{\\{items\\}\\}, \\{\\{deliveryFee\\}\\}, \\{\\{total\\}\\}, \\{\\{paymentMethod\\}\\}, \\{\\{paymentDetails\\}\\}, \\{\\{prepTimeMin\\}\\}, \\{\\{prepTimeMax\\}\\}, \\{\\{observacoes\\}\\}.";

// In JSX:
<p className="text-xs text-muted-foreground mt-2">
  {placeholdersText}
</p>

// ... (rest of component)