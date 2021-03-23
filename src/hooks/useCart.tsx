import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [stock, setStock] = useState<Stock[]>();
  const [products, setProducts] = useState<Product[]>();
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  useEffect(() => {
    async function loadProducts() {
      let response = await api.get('products');
      setProducts(response.data);

      response = await api.get('stock');
      setStock(response.data);
    }

    loadProducts()
  }, []);

  const addProduct = async (productId: number) => {
    try {
      const existInCart = cart.find(product => product.id === productId);
      const maxStock = stock?.find(stock => stock.id === productId);

      if (existInCart) {
        updateProductAmount({
          productId: existInCart.id,
          amount: existInCart.amount
        });


      } else if (!existInCart && products) {
        const foundedProduct = products.find(product => product.id === productId)

        if (maxStock && maxStock?.amount < 1) {
          toast.error('Não há mais produtos disponíveis.')
        }

        const newCart = [
          ...cart,
          { ...foundedProduct, amount: 1 },
        ];

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

        setCart(() => {
          const newStoragedCart = localStorage.getItem('@RocketShoes:cart')

          if (newStoragedCart) {
            return JSON.parse(newStoragedCart);
          }
        });

        toast.success('Produto adicionado ao carrinho.')
      }

    } catch {
      toast.error('Ocorreu um erro ao adicionar o produto ao carrinho.')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // pegando produto a partir do productId
      const product = cart.find(cartItem => productId == cartItem.id)

      // pegando estoque disponível do produto
      const productStock = stock?.find(stock => stock.id === productId);


      // verificando se existe estoque disponível para o produto
      if (productStock && product && productStock.amount > product.amount) {
        // atualizando carrinho com mais um produto
        const updatedCart = cart.map(product => {
          return product.id === productId
            ? { ...product, amount: amount + 1 }
            : product;
        });

        // atualizando carrinho no LOCAL STORAGE com mais um produto
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

        // atualizando cart
        setCart(() => {
          const newStoragedCart = localStorage.getItem('@RocketShoes:cart')

          if (newStoragedCart) {
            return JSON.parse(newStoragedCart);
          }
        });

        toast.success('Produto adicionado ao carrinho.')
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
